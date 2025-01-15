export default {
    size: {
        type: 'number',
        min: 0.1,
        max: 3,
        default: 1.5,
        step: 0.1,
        unit: 'em',
    },
    padding: {
        type: 'number',
        min: 0,
        max: 100,
        default: 10,
        step: 1,
        unit: '%',
    },
    excluded_tags: {
        type: 'list',
        default: ['SCRIPT', 'STYLE', 'TEXTAREA'],
    },
};
