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

// ===============================
// СХЕМИ ДЛЯ ГРУП САДОЧКА
// ===============================

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

const kindergartenGroupUpdateSchema = {
    params: {
        id: {
            type: 'string',
            numeric: true,
        }
    },
    body: {
        kindergarten_name: {
            type: 'string',
            min: 1,
            max: 100,
            optional: true,
        },
        group_name: {
            type: 'string',
            min: 1,
            max: 50,
            optional: true,
        },
        group_type: {
            type: 'string',
            enum: ['young', 'older'],
            optional: true,
        },
    }
}

const kindergartenGroupDeleteSchema = {
    params: {
        id: {
            type: 'string',
            numeric: true,
        }
    }
}

// ===============================
// СХЕМИ ДЛЯ ДІТЕЙ САДОЧКА
// ===============================

const childrenInfoSchema = {
    params: {
        id: {
            type: 'string',
            numeric: true,
        },
    }
}

const childrenFilterSchema = {
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
        child_name: {
            type: 'string',
            optional: true,
            min: 1,
        },
        parent_name: {
            type: 'string',
            optional: true,
            min: 1,
        },
        phone_number: {
            type: 'string',
            optional: true,
            min: 1,
        },
        group_id: {
            type: 'number',
            optional: true,
        },
    }
}

const childrenCreateSchema = {
    body: {
        child_name: {
            type: 'string',
            min: 1,
            max: 100,
        },
        parent_name: {
            type: 'string',
            min: 1,
            max: 100,
        },
        phone_number: {
            type: 'string',
            min: 10,
            max: 15,
            pattern: '^[+]?[0-9\\s\\-\\(\\)]{10,15}$'
        },
        group_id: {
            type: 'number',
            minimum: 1,
        },
    }
}

const childrenUpdateSchema = {
    params: {
        id: {
            type: 'string',
            numeric: true,
        }
    },
    body: {
        child_name: {
            type: 'string',
            min: 1,
            max: 100,
            optional: true,
        },
        parent_name: {
            type: 'string',
            min: 1,
            max: 100,
            optional: true,
        },
        phone_number: {
            type: 'string',
            min: 10,
            max: 15,
            pattern: '^[+]?[0-9\\s\\-\\(\\)]{10,15}$',
            optional: true,
        },
        group_id: {
            type: 'number',
            minimum: 1,
            optional: true,
        },
    }
}

const childrenDeleteSchema = {
    params: {
        id: {
            type: 'string',
            numeric: true,
        }
    }
}

module.exports = {
    // Основні схеми садочка
    kindergartenFilterSchema,
    kindergartenInfoSchema,
    
    // Схеми для груп
    kindergartenGroupFilterSchema,
    kindergartenGroupCreateSchema,
    kindergartenGroupUpdateSchema,
    kindergartenGroupDeleteSchema,
    
    // Схеми для дітей
    childrenFilterSchema,
    childrenInfoSchema,
    childrenCreateSchema,
    childrenUpdateSchema,
    childrenDeleteSchema,
}