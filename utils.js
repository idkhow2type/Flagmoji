/**
 * Debounce function
 * @param {Function} func - Function to be debounced
 * @param {Number} wait - Time to wait before calling the function
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function (...args) {
        // it dont work :(
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}
