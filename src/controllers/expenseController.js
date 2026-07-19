const mongoose = require('mongoose');
const Expense = require('../models/Expense');

function normalizeItem(item) {
  const { title, amount, category, date, note } = item || {};

  if (amount === undefined || !category || !date) {
    return { error: 'Amount, category, and date are required for each expense' };
  }

  return {
    data: {
      title: (title && String(title).trim()) || category,
      amount,
      category,
      date,
      note: note || '',
    },
  };
}

function summarizeItems(items) {
  const totalAmount = items.reduce((sum, item) => sum + Number(item.amount), 0);
  const date = new Date(
    Math.max(...items.map((item) => new Date(item.date).getTime()))
  );
  return { totalAmount, date };
}

function formatItem(item) {
  return {
    _id: item._id,
    title: item.title,
    amount: item.amount,
    category: item.category,
    date: item.date,
    note: item.note,
  };
}

function formatRecord(doc) {
  const items = (doc.items || []).map(formatItem);

  if (doc.kind === 'bulk') {
    return {
      kind: 'bulk',
      _id: doc._id,
      userId: doc.userId,
      date: doc.date,
      totalAmount: doc.totalAmount,
      count: items.length,
      items,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  const item = items[0];
  return {
    kind: 'single',
    _id: doc._id,
    userId: doc.userId,
    title: item.title,
    amount: item.amount,
    category: item.category,
    date: item.date,
    note: item.note,
    totalAmount: doc.totalAmount,
    items,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function buildMatchFilter(userId, query) {
  const { from, to, category } = query;
  const filter = { userId };

  if (category) {
    filter['items.category'] = category;
  }

  if (from || to) {
    filter.date = {};
    if (from) {
      const fromDate = new Date(from);
      if (Number.isNaN(fromDate.getTime())) {
        return { error: 'Invalid from date' };
      }
      filter.date.$gte = fromDate;
    }
    if (to) {
      const toDate = new Date(to);
      if (Number.isNaN(toDate.getTime())) {
        return { error: 'Invalid to date' };
      }
      filter.date.$lte = toDate;
    }
  }

  return { filter };
}

async function createExpense(req, res, next) {
  try {
    const built = normalizeItem(req.body);
    if (built.error) {
      return res.status(400).json({ message: built.error });
    }

    const items = [built.data];
    const { totalAmount, date } = summarizeItems(items);

    const expense = await Expense.create({
      userId: req.user._id,
      kind: 'single',
      items,
      date,
      totalAmount,
    });

    return res.status(201).json({
      kind: 'single',
      expense: formatRecord(expense),
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors)
        .map((e) => e.message)
        .join(', ');
      return res.status(400).json({ message });
    }
    return next(err);
  }
}

async function createExpensesBulk(req, res, next) {
  try {
    const rawItems = Array.isArray(req.body) ? req.body : req.body?.expenses;

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return res.status(400).json({
        message: 'Send a non-empty expenses array',
      });
    }

    if (rawItems.length > 50) {
      return res.status(400).json({
        message: 'You can add at most 50 expenses at once',
      });
    }

    const items = [];
    const errors = [];

    rawItems.forEach((item, index) => {
      const built = normalizeItem(item);
      if (built.error) {
        errors.push({ index, message: built.error });
        return;
      }
      items.push(built.data);
    });

    if (errors.length > 0) {
      return res.status(400).json({
        message: 'Some expenses are invalid',
        errors,
      });
    }

    const { totalAmount, date } = summarizeItems(items);

    // ONE MongoDB document for the whole bulk upload
    const expense = await Expense.create({
      userId: req.user._id,
      kind: 'bulk',
      items,
      date,
      totalAmount,
    });

    return res.status(201).json(formatRecord(expense));
  } catch (err) {
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors)
        .map((e) => e.message)
        .join(', ');
      return res.status(400).json({ message });
    }
    return next(err);
  }
}

async function listExpenses(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const matched = buildMatchFilter(req.user._id, req.query);
    if (matched.error) {
      return res.status(400).json({ message: matched.error });
    }

    const [expenses, total] = await Promise.all([
      Expense.find(matched.filter).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit),
      Expense.countDocuments(matched.filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return res.status(200).json({
      expenses: expenses.map(formatRecord),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function getExpense(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const expense = await Expense.findOne({ _id: id, userId: req.user._id });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    return res.status(200).json(formatRecord(expense));
  } catch (err) {
    return next(err);
  }
}

async function updateExpense(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const expense = await Expense.findOne({ _id: id, userId: req.user._id });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Bulk: replace whole items array
    if (Array.isArray(req.body.items) || Array.isArray(req.body.expenses)) {
      const rawItems = req.body.items || req.body.expenses;
      if (rawItems.length === 0) {
        return res.status(400).json({ message: 'items cannot be empty' });
      }
      if (rawItems.length > 50) {
        return res.status(400).json({ message: 'You can have at most 50 items' });
      }

      const items = [];
      const errors = [];
      rawItems.forEach((item, index) => {
        const built = normalizeItem(item);
        if (built.error) {
          errors.push({ index, message: built.error });
          return;
        }
        items.push(built.data);
      });

      if (errors.length > 0) {
        return res.status(400).json({ message: 'Some expenses are invalid', errors });
      }

      const { totalAmount, date } = summarizeItems(items);
      expense.kind = items.length > 1 ? 'bulk' : 'single';
      expense.items = items;
      expense.totalAmount = totalAmount;
      expense.date = date;
      await expense.save();

      return res.status(200).json(formatRecord(expense));
    }

    // Single / one-line partial update (updates first item, or item by itemId)
    const allowed = ['title', 'amount', 'category', 'date', 'note'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: 'No valid fields to update (or send items[] for bulk)',
      });
    }

    let target = expense.items[0];
    if (req.body.itemId) {
      target = expense.items.id(req.body.itemId);
      if (!target) {
        return res.status(404).json({ message: 'Item not found in this expense' });
      }
    }

    Object.assign(target, updates);
    const { totalAmount, date } = summarizeItems(expense.items);
    expense.totalAmount = totalAmount;
    expense.date = date;
    await expense.save();

    return res.status(200).json(formatRecord(expense));
  } catch (err) {
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors)
        .map((e) => e.message)
        .join(', ');
      return res.status(400).json({ message });
    }
    return next(err);
  }
}

async function deleteExpense(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Deletes the whole record (single OR entire bulk)
    const expense = await Expense.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createExpense,
  createExpensesBulk,
  listExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
};
