const { sqlRequest } = require("../../../helpers/database");
const { buildWhereCondition } = require("../../../utils/function");

class KindergartenRepository {

    async findDebtorById(id) {
        const sql = `
            select
                o.id,
                json_agg(
                    json_build_object(
                        'id', od.id,
                        'child_name', od.child_name,
                        'debt_amount', od.debt_amount,
                        'group_number', od.group_number,
                        'kindergarten_name', od.kindergarten_name
                    )
                ) as debts
            from ower.ower o
            left join ower.ower_debt od on o.id = od.ower_id
            where o.id = ?
            group by o.id
        `;
        return await sqlRequest(sql, [id]);
    }

    async findDebtByFilter(limit, offset, whereConditions = {}) {
        const values = [];
        let sql = `
            select json_agg(rw) as data,
                max(cnt) as count
                from (
                select json_build_object(
                    'id', od.id,
                    'child_name', od.child_name,
                    'debt_amount', od.debt_amount,
                    'group_number', od.group_number,
                    'kindergarten_name', od.kindergarten_name
                ) as rw,
                count(*) over () as cnt
            from ower.ower_debt od
            where 1=1
        `;

        if (Object.keys(whereConditions).length) {
            const data = buildWhereCondition(whereConditions, 'od');
            sql += data.text;
            values.push(...data.value);
        }

        values.push(limit);
        values.push(offset);
        sql += ` order by od.id desc limit ? offset ? ) q`;

        return await sqlRequest(sql, values);
    }

    async generateWordByDebtId(request, reply) {
        // Логіка генерації Word документа
        // Повертає файл
        return null;
    }

    async printDebtId(request, reply) {
        // Логіка друку
        // Повертає PDF або інший формат
        return null;
    }

    // ===============================
    // МЕТОДИ ДЛЯ ГРУП САДОЧКА
    // ===============================

    async findGroupsByFilter(options) {
        const {
            limit,
            offset,
            sort_by = 'id',
            sort_direction = 'desc',
            kindergarten_name,
            group_name,
            group_type
        } = options;

        const values = [];
        let sql = `
            select json_agg(rw) as data,
                max(cnt) as count
                from (
                select json_build_object(
                    'id', kg.id,
                    'kindergarten_name', kg.kindergarten_name,
                    'group_name', kg.group_name,
                    'group_type', kg.group_type,
                    'created_at', kg.created_at
                ) as rw,
                count(*) over () as cnt
            from ower.kindergarten_groups kg
            where 1=1
        `;

        // Додаємо фільтри
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

    async getGroupById(id) {
        const sql = `
            SELECT id, kindergarten_name, group_name, group_type, created_at 
            FROM ower.kindergarten_groups 
            WHERE id = ?
        `;
        return await sqlRequest(sql, [id]);
    }

    async updateGroup(id, groupData) {
        const fields = Object.keys(groupData).map(field => `${field} = ?`).join(', ');
        const values = [...Object.values(groupData), id];
        
        const sql = `
            UPDATE ower.kindergarten_groups 
            SET ${fields}
            WHERE id = ?
            RETURNING id, kindergarten_name, group_name, group_type, created_at
        `;
        
        return await sqlRequest(sql, values);
    }

    async deleteGroup(id) {
        const sql = `
            DELETE FROM ower.kindergarten_groups 
            WHERE id = ?
            RETURNING id
        `;
        
        return await sqlRequest(sql, [id]);
    }

    // ===============================
    // МЕТОДИ ДЛЯ ДІТЕЙ САДОЧКА
    // ===============================

    async findChildrenByFilter(options) {
        const {
            limit,
            offset,
            sort_by = 'id',
            sort_direction = 'desc',
            child_name,
            parent_name,
            phone_number,
            group_id
        } = options;

        const values = [];
        let sql = `
            select json_agg(rw) as data,
                max(cnt) as count
                from (
                select json_build_object(
                    'id', cr.id,
                    'child_name', cr.child_name,
                    'parent_name', cr.parent_name,
                    'phone_number', cr.phone_number,
                    'group_id', cr.group_id,
                    'group_name', kg.group_name,
                    'kindergarten_name', kg.kindergarten_name,
                    'created_at', cr.created_at
                ) as rw,
                count(*) over () as cnt
            from ower.children_roster cr
            left join ower.kindergarten_groups kg on kg.id = cr.group_id
            where 1=1
        `;

        // Додаємо фільтри
        if (child_name) {
            sql += ` AND cr.child_name ILIKE ?`;
            values.push(`%${child_name}%`);
        }

        if (parent_name) {
            sql += ` AND cr.parent_name ILIKE ?`;
            values.push(`%${parent_name}%`);
        }

        if (phone_number) {
            sql += ` AND cr.phone_number ILIKE ?`;
            values.push(`%${phone_number}%`);
        }

        if (group_id) {
            sql += ` AND cr.group_id = ?`;
            values.push(group_id);
        }

        // Додаємо сортування
        const allowedSortFields = ['id', 'child_name', 'parent_name', 'phone_number', 'group_id', 'created_at'];
        const validSortBy = allowedSortFields.includes(sort_by) ? sort_by : 'id';
        const validSortDirection = ['asc', 'desc'].includes(sort_direction.toLowerCase()) ? sort_direction.toUpperCase() : 'DESC';
        
        // Для сортування по групі використовуємо назву групи
        if (validSortBy === 'group_id') {
            sql += ` ORDER BY kg.group_name ${validSortDirection}`;
        } else {
            sql += ` ORDER BY cr.${validSortBy} ${validSortDirection}`;
        }
        
        // Додаємо пагінацію
        sql += ` LIMIT ? OFFSET ?`;
        values.push(limit, offset);
        
        sql += `) q`;

        return await sqlRequest(sql, values);
    }

    async getChildById(id) {
        const sql = `
            SELECT 
                cr.id, 
                cr.child_name, 
                cr.parent_name, 
                cr.phone_number, 
                cr.group_id,
                cr.created_at,
                kg.group_name,
                kg.kindergarten_name
            FROM ower.children_roster cr
            LEFT JOIN ower.kindergarten_groups kg ON kg.id = cr.group_id
            WHERE cr.id = ?
        `;
        return await sqlRequest(sql, [id]);
    }

    async getChildByNameAndGroup(childName, groupId, excludeId = null) {
        let sql = `
            SELECT id, child_name, group_id 
            FROM ower.children_roster 
            WHERE child_name = ? AND group_id = ?
        `;
        const values = [childName, groupId];

        if (excludeId) {
            sql += ` AND id != ?`;
            values.push(excludeId);
        }

        return await sqlRequest(sql, values);
    }

    async createChild(childData) {
        const {
            child_name,
            parent_name,
            phone_number,
            group_id,
            created_at
        } = childData;

        const sql = `
            INSERT INTO ower.children_roster 
            (child_name, parent_name, phone_number, group_id, created_at)
            VALUES (?, ?, ?, ?, ?)
            RETURNING id, child_name, parent_name, phone_number, group_id, created_at
        `;

        const values = [
            child_name,
            parent_name,
            phone_number,
            group_id,
            created_at
        ];

        return await sqlRequest(sql, values);
    }

    async updateChild(id, childData) {
        const fields = Object.keys(childData).map(field => `${field} = ?`).join(', ');
        const values = [...Object.values(childData), id];
        
        const sql = `
            UPDATE ower.children_roster 
            SET ${fields}
            WHERE id = ?
            RETURNING id, child_name, parent_name, phone_number, group_id, created_at
        `;
        
        return await sqlRequest(sql, values);
    }

    async deleteChild(id) {
        const sql = `
            DELETE FROM ower.children_roster 
            WHERE id = ?
            RETURNING id
        `;
        
        return await sqlRequest(sql, [id]);
    }

    async getChildrenByGroupId(groupId) {
        const sql = `
            SELECT 
                cr.id, 
                cr.child_name, 
                cr.parent_name, 
                cr.phone_number, 
                cr.group_id,
                cr.created_at
            FROM ower.children_roster cr
            WHERE cr.group_id = ?
            ORDER BY cr.child_name ASC
        `;
        return await sqlRequest(sql, [groupId]);
    }

    async countChildrenInGroup(groupId) {
        const sql = `
            SELECT COUNT(*) as children_count 
            FROM ower.children_roster 
            WHERE group_id = ?
        `;
        return await sqlRequest(sql, [groupId]);
    }
}

module.exports = new KindergartenRepository();