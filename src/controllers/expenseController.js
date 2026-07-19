const mongoose = require('mongoose');
const Expense = require('../models/Expense');

function formatExpense(expense) {
  return {
    _id: expense._id,
    userId: expense.userId,
    title: expense.title,
    amount: expense.amount,
    category: expense.category,
    date: expense.date,
    note: expense.note,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  };
}

function buildExpensePayload(item, userId) {
  const { title, amount, category, date, note } = item;

  if (amount === undefined || !category || !date) {
    return { error: 'Amount, category, and date are required for each expense' };
  }

  return {
    data: {
      userId,
      title: (title && String(title).trim()) || category,
      amount,
      category,
      date,
      note: note || '',
    },
  };
}

async function createExpense(req, res, next) {
  try {
    const built = buildExpensePayload(req.body, req.user._id);
    if (built.error) {
      return res.status(400).json({ message: built.error });
    }

    const expense = await Expense.create(built.data);

    return res.status(201).json({ expense: formatExpense(expense) });
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
    const items = Array.isArray(req.body) ? req.body : req.body?.expenses;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: 'Send a non-empty expenses array',
      });
    }

    if (items.length > 50) {
      return res.status(400).json({
        message: 'You can add at most 50 expenses at once',
      });
    }

    const docs = [];
    const errors = [];

    items.forEach((item, index) => {
      const built = buildExpensePayload(item || {}, req.user._id);
      if (built.error) {
        errors.push({ index, message: built.error });
        return;
      }
      docs.push(built.data);
    });

    if (errors.length > 0) {
      return res.status(400).json({
        message: 'Some expenses are invalid',
        errors,
      });
    }

    const created = await Expense.insertMany(docs, { ordered: true });

    return res.status(201).json({
      count: created.length,
      expenses: created.map(formatExpense),
    });
  } catch (err) {
    if (err.name === 'ValidationError' || err.name === 'BulkWriteError') {
      return res.status(400).json({
        message: err.message || 'Failed to create expenses',
      });
    }
    return next(err);
  }
}

async function listExpenses(req, res, next) {
  try {
    const { from, to, category } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = { userId: req.user._id };

    if (category) {
      filter.category = category;
    }

    if (from || to) {
      filter.date = {};
      if (from) {
        const fromDate = new Date(from);
        if (Number.isNaN(fromDate.getTime())) {
          return res.status(400).json({ message: 'Invalid from date' });
        }
        filter.date.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        if (Number.isNaN(toDate.getTime())) {
          return res.status(400).json({ message: 'Invalid to date' });
        }
        filter.date.$lte = toDate;
      }
    }

    const [expenses, total] = await Promise.all([
      Expense.find(filter).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit),
      Expense.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return res.status(200).json({
      expenses: expenses.map(formatExpense),
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

    return res.status(200).json({ expense: formatExpense(expense) });
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

    const allowed = ['title', 'amount', 'category', 'date', 'note'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    return res.status(200).json({ expense: formatExpense(expense) });
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
