
const kindergartenInfoSchema = {
    params: {
        id: {
            type: 'string',
            numeric: true,
        },
    }
}

const kindergartenFilterSchema = {
    body: {
        page: {
            type: 'number',
            optional: true,
        },
        title: {
            type: 'string',
            optional: true,
            min: 1,
        },
        child_name: {
            type: 'string',
            optional: true,
            min: 1,
        },
    }
}

const kindergartenGroupFilterSchema = {
    body: {
        page: {
            type: 'number',
            optional: true,
        },
        limit: {
            type: 'number', 
            optional: true,
        },
        sort_by: {
            type: 'string',
            optional: true,
        },
        sort_direction: {
            type: 'string',
            optional: true,
        },
        kindergarten_name: {
            type: 'string',
            optional: true,
            min: 1,
        },
        group_name: {
            type: 'string',
            optional: true,
            min: 1,
        },
        group_type: {
            type: 'string',
            optional: true,
        },
    }
}

const kindergartenGroupCreateSchema = {
    body: {
        kindergarten_name: {
            type: 'string',
            min: 1,
            max: 100,
        },
        group_name: {
            type: 'string',
            min: 1,
            max: 50,
        },
        group_type: {
            type: 'string',
            enum: ['young', 'older'],
        },
    }
}

module.exports = {
    kindergartenFilterSchema,
    kindergartenInfoSchema,
    kindergartenGroupFilterSchema,
    kindergartenGroupCreateSchema,
}