const { sqlRequest } = require("../../../helpers/database");
const { buildWhereCondition } = require("../../../utils/function");


class KindergartenRepository {

    async getDebtByDebtorId(debtId, displayFieldsUsers) {
        let sql = `select ${displayFieldsUsers.map(field => ` ${field}`)} from ower.kindergarten_debt where id = ?`
        return await sqlRequest(sql, [debtId])
    }

    async findDebtByFilter(limit, offset, title, whereConditions = {}, displayFieldsUsers = []) {
        const values = [];
        let sql = `select json_agg(rw) as data,
            max(cnt) as count
            from (
            select json_build_object(${displayFieldsUsers.map(field => `'${field}', ${field}`).join(', ')})  as rw,
            count(*) over () as cnt
            from ower.kindergarten_debt
            where 1=1`

        if (Object.keys(whereConditions).length) {
            const data = buildWhereCondition(whereConditions)
            sql += data.text;
            values.push(...data.value)
        }

        if (title) {
            sql += ` and child_name ILIKE ?`
            values.push(`%${title}%`)
        }

        values.push(limit)
        values.push(offset)
        sql += ` order by id desc limit ? offset ? ) q`
        return await sqlRequest(sql, [...values])
    }

    async getRequisite() {
        return await sqlRequest('select * from ower.kindergarten_settings')
    }

    async findGroupsByFilter({
        limit, 
        offset, 
        sort_by = 'id', 
        sort_direction = 'desc',
        kindergarten_name,
        group_name,
        group_type,
        ...whereConditions
    }) {
        const values = [];
        
        let sql = `
            SELECT json_agg(rw) as data, max(cnt) as count
            FROM (
                SELECT json_build_object(
                    'id', kg.id,
                    'kindergarten_name', kg.kindergarten_name,
                    'group_name', kg.group_name,
                    'group_type', kg.group_type,
                    'created_at', kg.created_at
                ) as rw,
                count(*) over () as cnt
                FROM ower.kindergarten_groups kg  -- ЗМІНЕНО: ower замість kindergarten
                WHERE 1=1
        `;

        // Додаємо умови фільтрації
        if (kindergarten_name) {
            sql += ` AND kg.kindergarten_name ILIKE ?`;
            values.push(`%${kindergarten_name}%`);
        }

        if (group_name) {
            sql += ` AND kg.group_name ILIKE ?`;
            values.push(`%${group_name}%`);
        }

        if (group_type) {
            sql += ` AND kg.group_type = ?`;
            values.push(group_type);
        }

        // Додаємо сортування
        const allowedSortFields = ['id', 'kindergarten_name', 'group_name', 'group_type', 'created_at'];
        const validSortBy = allowedSortFields.includes(sort_by) ? sort_by : 'id';
        const validSortDirection = ['asc', 'desc'].includes(sort_direction.toLowerCase()) ? sort_direction.toUpperCase() : 'DESC';
        
        sql += ` ORDER BY kg.${validSortBy} ${validSortDirection}`;
        
        // Додаємо пагінацію
        sql += ` LIMIT ? OFFSET ?`;
        values.push(limit, offset);
        
        sql += `) q`;

        return await sqlRequest(sql, values);
    }

    async getGroupByNameAndKindergarten(groupName, kindergartenName, excludeId = null) {
    let sql = `
        SELECT id, kindergarten_name, group_name 
        FROM ower.kindergarten_groups 
        WHERE group_name = ? AND kindergarten_name = ?
    `;
    const values = [groupName, kindergartenName];

    if (excludeId) {
        sql += ` AND id != ?`;
        values.push(excludeId);
    }

    return await sqlRequest(sql, values);
}

async createGroup(groupData) {
    const {
        kindergarten_name,
        group_name,
        group_type,
        created_at
    } = groupData;

    const sql = `
        INSERT INTO ower.kindergarten_groups 
        (kindergarten_name, group_name, group_type, created_at)
        VALUES (?, ?, ?, ?)
        RETURNING id, kindergarten_name, group_name, group_type, created_at
    `;

    const values = [
        kindergarten_name,
        group_name,
        group_type,
        created_at
    ];

    return await sqlRequest(sql, values);
}
}

module.exports = new KindergartenRepository();