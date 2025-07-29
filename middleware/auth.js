// Authentication middleware
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        req.flash('error', 'Please log in to access this page');
        res.redirect('/auth/login');
    }
};

// Authorization middleware for kitchen owners
const isOwner = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'owner') {
        next();
    } else {
        req.flash('error', 'Access denied. Kitchen owner privileges required.');
        res.redirect('/');
    }
};

// Authorization middleware for admins
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        req.flash('error', 'Access denied. Admin privileges required.');
        res.redirect('/');
    }
};

// Authorization middleware for owner or admin
const isOwnerOrAdmin = (req, res, next) => {
    if (req.session.user && (req.session.user.role === 'owner' || req.session.user.role === 'admin')) {
        next();
    } else {
        req.flash('error', 'Access denied. Owner or admin privileges required.');
        res.redirect('/');
    }
};

module.exports = {
    isAuthenticated,
    isOwner,
    isAdmin,
    isOwnerOrAdmin
}; 