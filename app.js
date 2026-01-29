require("dotenv").config()
require("./utilities/database")
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

// User type routes
var superAdminRouter = require('./routes/superAdmin.routes');
var adminRouter = require('./routes/admin.routes');
var districtCoordinatorRouter = require('./routes/districtCoordinator.routes');
var coordinatorRouter = require('./routes/coordinator.routes');
var fieldManagerRouter = require('./routes/fieldManager.routes');
var teamLeaderRouter = require('./routes/teamLeader.routes');
var fieldEmployeeRouter = require('./routes/fieldEmployee.routes');

var app = express();

// CORS configuration - Allow all origins
app.use(cors());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Base routes
app.use('/', indexRouter);
app.use('/users', usersRouter);

// User type specific routes
app.use('/api/super-admin', superAdminRouter);
app.use('/api/admin', adminRouter);
app.use('/api/district-coordinator', districtCoordinatorRouter);
app.use('/api/coordinator', coordinatorRouter);
app.use('/api/field-manager', fieldManagerRouter);
app.use('/api/team-leader', teamLeaderRouter);
app.use('/api/field-employee', fieldEmployeeRouter);

// Category routes - Protected (Super Admin only)
var categoryRouter = require('./routes/category.routes');
app.use('/api/super-admin', categoryRouter);

// Subject routes - Protected (Super Admin only)
var subjectRouter = require('./routes/subject.routes');
app.use('/api/super-admin', subjectRouter);

// Board routes - Protected (Super Admin only)
var boardRouter = require('./routes/board.routes');
app.use('/api/super-admin', boardRouter);

// Plan routes - Protected (Super Admin only)
var planRouter = require('./routes/plan.routes');
app.use('/api/super-admin', planRouter);

// Public category routes (no authentication)
var publicCategoryRouter = require('./routes/publicCategory.routes');
app.use('/api/public/category', publicCategoryRouter);

// Student routes (public - signup/login)
var studentRouter = require('./routes/student.routes');
app.use('/api/student', studentRouter);

// Course routes - Protected (Super Admin only)
var courseRouter = require('./routes/course.routes');
app.use('/api/super-admin', courseRouter);

// Public course routes (no authentication)
var publicCourseRouter = require('./routes/publicCourse.routes');
app.use('/api/public/course', publicCourseRouter);

module.exports = app;
