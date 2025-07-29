const helpers = {
    // Capitalize first letter of a string
    capitalize: function(str) {
        if (typeof str !== 'string') return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    // Check if two values are equal
    eq: function(v1, v2) {
        return v1 === v2;
    },

    // Generate an array of numbers for pagination
    range: function(start, end) {
        const result = [];
        for (let i = start; i <= end; i++) {
            result.push(i);
        }
        return result;
    },

    // Add two numbers
    add: function(v1, v2) {
        return v1 + v2;
    },

    // Subtract two numbers
    subtract: function(v1, v2) {
        return v1 - v2;
    },

    // Greater than comparison
    gt: function(v1, v2) {
        return v1 > v2;
    },

    // Less than comparison
    lt: function(v1, v2) {
        return v1 < v2;
    },

    // Repeat something n times
    times: function(n, block) {
        let accum = '';
        for (let i = 0; i < n; i++) {
            accum += block.fn(i);
        }
        return accum;
    },

    // Truncate text to a certain length
    truncate: function(text, length) {
        if (!text) return '';
        if (text.length <= length) return text;
        return text.slice(0, length) + '...';
    },

    // Format date to a readable string
    formatDate: function(date) {
        if (!date) return '';
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(date).toLocaleDateString('en-US', options);
    },

    encodeURI: function(str) {
        return encodeURIComponent(str);
    },

    // Calculate duration in hours between two time strings (HH:mm)
    calculateDuration: function(startTime, endTime) {
        if (!startTime || !endTime) return '';
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        let duration = (endHour + endMin / 60) - (startHour + startMin / 60);
        if (duration < 0) duration += 24; // handle overnight
        return duration.toFixed(2) + ' hours';
    }
};

const Handlebars = require('handlebars');

Handlebars.registerHelper('eq', function(a, b) {
    return a === b;
});

Handlebars.registerHelper('json', function(context) {
    return JSON.stringify(context);
});

Handlebars.registerHelper('encodeURI', function(str) {
    return encodeURIComponent(str);
});

Handlebars.registerHelper('calculateDuration', function(startTime, endTime) {
    if (!startTime || !endTime) return '';
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    let duration = (endHour + endMin / 60) - (startHour + startMin / 60);
    if (duration < 0) duration += 24;
    return duration.toFixed(2) + ' hours';
});

module.exports = helpers; 