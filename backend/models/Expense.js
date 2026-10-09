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
        },
        purpose: {
            type: String,
            required: true,
            enum: ['Work', 'Private'],
        },
        fin_year: {
            type: String,
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

// // Verify that the User actually exists before saving.
expenseSchema.pre('validate', async function () {
    if (!this.user_id) return;

    const userExists = await User.exists({ _id: this.user_id });
    if (!userExists) {
        this.invalidate('user_id', 'User does not exist');
    }
});

module.exports = mongoose.model('Expense', expenseSchema);