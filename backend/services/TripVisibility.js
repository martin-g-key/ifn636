// backend/services/TripVisibility.js
//
// Decides WHICH trips a user may see. Role rules and the financial-year
// filter are combined with AND, so every filter overlaps with the role rules.

const UsersModel = require('../models/Users');

class TripVisibility {
    //  private 

    // purpose value for business trips, same as your expense rules
    static #BUSINESS_PURPOSE = 'Business';

    static async #roleFilter(user) {
        if (user.role === 'Employee') {
            return { user_id: user.sub }; // own trips only
        }

        if (user.role === 'Employer') {
            // only employees who list THIS employer, never other employers' staff
            const employees = await UsersModel.find({
                role: 'Employee',
                employer_username: user.username,
            }).select('_id');

            return {
                user_id: { $in: employees.map((e) => e._id) },
                purpose: TripVisibility.#BUSINESS_PURPOSE, // Private trips never visible
            };
        }

        return { _id: { $in: [] } }; // unknown role: deny by default
    }

    // public 

    // MongoDB filter for the trips this user may see, optionally for one FY
    static async buildFilter(user, { finYear } = {}) {
        const filter = await TripVisibility.#roleFilter(user);
        if (finYear) filter.fin_year = finYear;
        return filter;
    }
}

module.exports = TripVisibility;
