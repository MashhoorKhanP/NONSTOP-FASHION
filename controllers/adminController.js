const Admin = require('../models/adminModel');
const User = require('../models/userModel');
const Orders = require('../models/orderModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
require('dotenv').config();

const getOTP = () => Math.floor(Math.random() * 900000) + 100000;

/**Hashing Function Start*/
const securePassword = async (password) => {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        return hashedPassword;
    } catch (error) {
        next(error.message);
    }
}
/**Hashing Function End*/

/**Login Start*/
const getLogin = async (req, res, next) => {
    try {
        res.render('login', { title: 'Admin Login' });
    } catch (error) {
        next(error);
    }
}

const getOTPLogin = async (req, res, next) => {
    try {
        res.render('otpLogin', { title: 'Admin OTP Login' });
    } catch (error) {
        next(error);
    }
}

const postLogin = async (req, res, next) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const secPassword = await securePassword(password);
        const adminData = await Admin.findOne({ email: email });
        if (adminData) {
            const passwordMatch = await bcrypt.compare(password, adminData.password);
            if (passwordMatch) {
                req.session.admin = adminData;
                res.redirect('/admin/dashboard');
                //res.render('dashboard', { admin: adminData, title: 'Admin Dashboard', page: 'Dashboard' });
            } else {
                req.app.locals.message = 'Invalid Email or Password';
                res.redirect('/admin');
            }
        } else {
            res.render('login', { message: 'Invalid Email or Password' });
        }
    } catch (error) {
        next(error);
    }

}

const postSendOTP = async (req, res, next) => {
    try {
        const email = req.body.email;
        // const secPassword= await securePassword(password);
        const adminData = await Admin.findOne({ email: email });
        if (adminData) {
            const OTP = getOTP();
            req.session.OTP = OTP

            //console.log(req.session.OTP);
            req.session.admin = adminData;
            req.session.save();

            sendVerifyMail(email, OTP);
            res.render('otpVerification', { title: 'Admin Verification Login', email: req.session.admin.email, AdminOTPLoginmessage: 'OTP Sended Successfully' })
        } else {
            res.render('otpLogin', { email: req.session.admin.email, AdminOTPLoginmessage: 'Please fill the  required fields', title: 'Admin OTP Login' })
        }
    } catch (error) {
        next(error)
    }
}

const postOTPLogin = async (req, res, next) => {
    try {
        //console.log(req.session.OTP);
        const enteredOtp = Number(req.body.otp);
        const sharedOtp = Number(req.session.OTP);
        const email = req.session.admin.email;
        //console.log(email)
        if (enteredOtp === sharedOtp) {
            res.redirect('/admin/dashboard');
        } else {
            console.log('Incorrect OTP');
            req.app.locals.message = 'Invalid OTP';
            res.redirect('/admin/otplogin');
        }
    } catch (error) {
        next(error);
    }
}

const getResendOTP = async (req, res, next) => {
    try {
        const email = req.query.id;
        //console.log(email)
        const resendedOTP = getOTP()
        req.session.OTP = resendedOTP
        sendVerifyMail(email, resendedOTP);
        //console.log(resendedOTP);
        res.render('otpVerification', { title: 'Verification Page', email, AdminOTPLoginmessage: 'OTP resended successfully,Please check your email' });
    } catch (error) {
        next(error);
    }
}
/** Get Resend OTP End */
/** Send Verify OTP Start*/
const sendVerifyMail = async (email, OTP, next) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: 'mashhoorkhan325pc@gmail.com',
                pass: process.env.PASSWORD
            }
        });

        const mailOptions = {
            from: 'mashhoorkhan325pc@gmail.com',
            to: email,
            subject: 'Verify your Admin account',
            html: `<h1> Hello, ${email} </h1><h5>Your OTP for verification is, </h5><p>OTP: ${OTP}</p><p>`
        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                next(error);
            } else {
                console.log("Email sent successfully", info.response);
            }
        })
    } catch (error) {
        next(error);
    }
}
/**Logout Start*/
const postLogout = async (req, res, next) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                next(err);
            } else {
                res.redirect('/admin');
            }
        });
    } catch (error) {
        next(error);
    }
}
/**Logout End*/
/** Formatted Date Function Start */
function formattedDate(date) {
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        //   timeZoneName: 'short',
    };
    return date.toLocaleDateString('en-US', options);
}
/** Formatted Date Function End */
/** Get Dashboard Users Start */
const getDashboardUsers = async (req, res, next) => {
    try {
        let pageNum = 1;
        if (req.query.pageNum) {
            pageNum = parseInt(req.query.pageNum)
        }
        let limit = 8;
        if (req.query.limit) {
            limit = parseInt(req.query.limit);
        }
        const totalUserData = await User.find({}).count();
        let pageCount = Math.ceil(totalUserData / limit);
        var search = '';
        if (req.query.search) {
            search = req.query.search;
        }
        const admin = req.session.admin;
        const adminData = await Admin.findOne({ email: admin.email });
        const userData = await User.find({
            $or: [
                { firstName: { $regex: '.*' + search + '.*', $options: 'i' } },
                { lastName: { $regex: '.*' + search + '.*', $options: 'i' } },
                { email: { $regex: '.*' + search + '.*', $options: 'i' } },
            ],
        }).sort({ createdAt: -1 }).skip((pageNum - 1) * limit).limit(limit);;

        userData.forEach(user => {
            user.formattedCreatedAt = formattedDate(user.createdAt);
        });

        if (req.session.admin) {
            res.render('users', { users: userData, admin: adminData, pageCount, pageNum, limit, title: 'Admin Users Page', page: 'Users' });
        } else {
            return res.redirect('/admin');
        }
    } catch (error) {
        next(error);
    }
};
/** Get Dashboard Users End */
/** Get Dashboard Start */
const getDashboard = async (req, res, next) => {
    try {
        let salesYear = 0;
        let salesMonth = '';
        let displayValue = 'Year'
        let xDisplayValue = 'Years'
        if (req.query.year) {
            salesYear = parseInt(req.query.year);
            displayValue = req.query.year
            xDisplayValue = 'Months'
        } else {
            salesYear = 2023
        }
        if (req.query.month) {
            salesMonth = parseInt(req.query.month)
            xDisplayValue = 'Weeks'
            const monthNames = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];
            const monthName = monthNames[req.query.month - 1];
            displayValue = `${req.query.year} - ${monthName}`
        }
        const totalYears = await Orders.aggregate([
            { $group: { _id: { date: { $dateToString: { format: "%Y", date: "$date" } } } } },
            { $sort: { '_id.date': -1 } }
        ])
        const displayYears = []
        totalYears.forEach((year) => { displayYears.push(year._id.date) })
        let salesAggregationPipeline = [
            {
                $match: {
                    status: 'Delivered'
                }
            },
            {
                $group: {
                    _id: { date: { $dateToString: { format: "%Y", date: "$date" } } },
                    sales: { $sum: '$totalPrice' }
                }
            },
            { $sort: { '_id.date': 1 } }
        ]
        if (req.query.year && !req.query.month) {
            salesAggregationPipeline = [
                {
                    $match: {
                        status: 'Delivered',
                        date: {
                            $gte: new Date(`${salesYear}-01-01`),
                            $lt: new Date(`${salesYear + 1}-01-01`)
                        }
                    }
                },
                {
                    $group: {
                        _id: { date: { $dateToString: { format: "%m", date: "$date" } } },
                        sales: { $sum: '$totalPrice' }
                    }
                },
                { $sort: { '_id.date': 1 } }
            ]
        }
        if (req.query.year && req.query.month) {
            const firstDayofMonth = new Date(salesYear, salesMonth - 1, 1);
            const lastDayofMonth = new Date(salesYear, salesMonth, 0);
            salesAggregationPipeline = [
                {
                    $match: {
                        status: 'Delivered',
                        date: {
                            $gte: firstDayofMonth,
                            $lt: lastDayofMonth
                        }
                    }
                },
                {
                    $addFields: {
                        weekNumber: {
                            $ceil: {
                                $divide: [
                                    { $subtract: ["$date", firstDayofMonth] },
                                    604800000 // milliseconds in a week (7 days)
                                ]
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: { date: "$weekNumber" },
                        sales: { $sum: '$totalPrice' }
                    }
                },
                { $sort: { '_id.date.date': 1 } }
            ]
        }
        //Sales
        const orderData = await Orders.aggregate(salesAggregationPipeline)
        let months = []
        let sales = []
        if (req.query.year && !req.query.month) {
            function getMonthName(monthNumber) {
                if (monthNumber < 1 || monthNumber > 12) {
                    return "Invalid month number";
                }
                const monthNames = ["January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                ];
                return monthNames[monthNumber - 1];
            }
            orderData.forEach((month) => { months.push(getMonthName(month._id.date)) })
            orderData.forEach((sale) => { sales.push(Math.round(sale.sales)) })
        } else if (req.query.year && req.query.month) {
            orderData.forEach((year) => { months.push(`Week ${year._id.date}`) })
            orderData.forEach((sale) => { sales.push(Math.round(sale.sales)) })
        } else {
            orderData.forEach((year) => { months.push(year._id.date) })
            orderData.forEach((sale) => { sales.push(Math.round(sale.sales)) })
        }
        let totalSales = sales.reduce((acc, curr) => acc += curr, 0)
        //Category Sales
        let category = []
        let categorySales = []
        const categoryData = await Orders.aggregate([
            { $match: { status: 'Delivered' } },
            {
                $unwind: '$products'
            },
            {
                $lookup: {
                    from: 'products', // When using Replace  with the actual name of your products collection
                    localField: 'products.productId',
                    foreignField: '_id',
                    as: 'populatedProduct'
                }
            },
            {
                $unwind: '$populatedProduct'
            },
            {
                $lookup: {
                    from: 'categories',// When using Replace  with the actual name of your categories collection
                    localField: 'populatedProduct.category',
                    foreignField: '_id',
                    as: 'populatedCategory'
                }
            },
            {
                $group: {
                    _id: '$populatedCategory.name', sales: { $sum: '$products.totalProductDiscountPrice' }
                }
            }
        ])
        categoryData.forEach((cat) => {
            category.push(cat._id)
            categorySales.push(cat.sales)
        })
        const paymentData = await Orders.aggregate([
            { $match: { status: 'Delivered' } },
            { $group: { _id: "$paymentMethod", count: { $sum: 1 } } }
        ])
        let paymentMethods = []
        let paymentCount = []
        paymentData.forEach((data) => {
            paymentMethods.push(data._id),
                paymentCount.push(data.count)
        })
        let orderDataDownload = await Orders.find({ status: 'Delivered' }).sort({ date: 1 })

        if (req.query.sDate) {
            let sDate = req.query.sDate //Start Date
            let eDate = req.query.eDate //End Date
            sDate = new Date(sDate)
            eDate = new Date(eDate)
            eDate = new Date(eDate.getTime() + 1 * 24 * 60 * 60 * 1000);
            orderDataDownload = await Orders.find({ status: 'Delivered', date: { $gte: sDate, $lte: eDate } }).sort({ date: 1 })
        }
        const userCount = await User.find({}).count();
        const orderCount = await Orders.find({ status: 'Delivered' }).count();
        const salesCount = await Orders.aggregate([{ $match: { status: 'Delivered' } }, { $group: { _id: '$status', total: { $sum: '$totalPrice' } } }])
        let totalSalesProfit = 0
        if (salesCount && salesCount.length > 0) totalSalesProfit = salesCount[0].total
        const admin = req.session.admin;
        const adminData = await Admin.findOne({ email: admin.email });

        if (adminData) {
            res.render('dashboard', {
                admin: adminData, userCount, orderCount, totalSalesProfit, displayValue, xDisplayValue,
                sales, months, salesYear, displayYears, totalSales,
                category, categorySales,
                paymentMethods, paymentCount,
                orderDataDownload,
                title: 'Admin Dashboard', page: 'Dashboard'
            })
        }
    } catch (error) {
        next(error);
    }
}

const postUsersStatus = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const userData = await User.findById({ _id: userId });
        if (userData) {
            if (userData.blocked === true) {
                await User.findByIdAndUpdate({ _id: userId }, { $set: { blocked: false } });
            } else {
                await User.findByIdAndUpdate({ _id: userId }, { $set: { blocked: true } });
            }
        }
        res.redirect('/admin/users');
    } catch (error) {
        next(error);
    }
}
/** Post User Unblock/block End */

module.exports = {
    getLogin,
    getOTPLogin,
    postSendOTP,
    getResendOTP,
    postLogin,
    postOTPLogin,
    postLogout,
    getDashboardUsers,
    postUsersStatus,
    getDashboard
} 