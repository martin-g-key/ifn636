const mongoose = require('mongoose');

const User = require('./Users');

const expenseSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: User.modelName,
            required: true,
        },
        expense_date: {
            type: Date,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
            validate: {
                validator: Number.isInteger,
                message: 'Amount should be an integer number of cents',
            },
        },
        purpose: {
            type: String,
            required: true,
            enum: ['Business', 'Private'],
        },
        fin_year: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            required: true,
            enum: ['Submitted', 'Rejected', 'Approved', 'Paid'],
            default: 'Submitted',
        },
        approved_at: {
            type: Date,
            default: null,
        },
        paid_at: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
        toJSON: {
            transform: (doc, ret) => {
                ret.expense_id = ret._id.toString();
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    }
);

// Supports report queries filtered by user and financial year.
expenseSchema.index({ user_id: 1, fin_year: 1 });

// Set Australian financial year from the expense date and validate that the user exists.
expenseSchema.pre('validate', async function () {
    if (this.expense_date instanceof Date && !Number.isNaN(this.expense_date.getTime())) {
        const y = this.expense_date.getUTCFullYear();
        const startYear = this.expense_date.getUTCMonth() >= 6 ? y : y - 1;
        this.fin_year = startYear + 1;
    }

    if (!this.user_id) return;

    const userExists = await User.exists({ _id: this.user_id });
    if (!userExists) {
        this.invalidate('user_id', 'User does not exist');
    }
});

module.exports = mongoose.model('Expense', expenseSchema);