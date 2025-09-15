const KindergartenRepository = require("../repository/kindergarten-repository");
const { paginate, paginationData } = require("../../../utils/function");
const logRepository = require('../../log/repository/log-repository');

class KindergartenService {

    async getDebtByDebtorId(request) {
        const userData = await KindergartenRepository.findDebtorById(request.params?.id)
        return userData[0];
    }

    async findDebtByFilter(request) {
        const { page = 1, limit = 16, ...whereConditions } = request.body;
        const { offset } = paginate(page, limit);
        const userData = await KindergartenRepository.findDebtByFilter(limit, offset, whereConditions);
        return paginationData(userData[0], page, limit);
    }

    async generateWordByDebtId(request, reply) {
        const userData = await KindergartenRepository.generateWordByDebtId(request, reply)
        return userData;
    }

    async printDebtId(request, reply) {
        const userData = await KindergartenRepository.printDebtId(request, reply)
        return userData;
    }

    // ===============================
    // МЕТОДИ ДЛЯ ГРУП САДОЧКА
    // ===============================

    async findGroupsByFilter(request) {
        const { 
            page = 1, 
            limit = 16, 
            sort_by = 'id', 
            sort_direction = 'desc',
            kindergarten_name,
            group_name,
            group_type,
            ...whereConditions 
        } = request.body;

        const { offset } = paginate(page, limit);
        
        // Логування пошуку якщо є параметри фільтрації
        if (kindergarten_name || group_name || group_type) {
            await logRepository.createLog({
                row_pk_id: null,
                uid: request?.user?.id,
                action: 'SEARCH',
                client_addr: request?.ip,
                application_name: 'Пошук груп садочку',
                action_stamp_tx: new Date(),
                action_stamp_stm: new Date(),
                action_stamp_clk: new Date(),
                schema_name: 'ower',
                table_name: 'kindergarten_groups',
                oid: '16505',
            });
        }

        const userData = await KindergartenRepository.findGroupsByFilter({
            limit,
            offset,
            sort_by,
            sort_direction,
            kindergarten_name,
            group_name,
            group_type,
            ...whereConditions
        });

        return paginationData(userData[0], page, limit);
    }

    async createGroup(request) {
        const {
            kindergarten_name,
            group_name,
            group_type
        } = request.body;

        // Перевіряємо чи не існує група з такою назвою в цьому садочку
        const existingGroup = await KindergartenRepository.getGroupByNameAndKindergarten(
            group_name, 
            kindergarten_name
        );

        if (existingGroup && existingGroup.length > 0) {
            throw new Error('Група з такою назвою вже існує в цьому садочку');
        }

        const groupData = {
            kindergarten_name,
            group_name,
            group_type,
            created_at: new Date()
        };

        const result = await KindergartenRepository.createGroup(groupData);

        // Логування створення групи
        await logRepository.createLog({
            row_pk_id: result.insertId || result.id,
            uid: request?.user?.id,
            action: 'INSERT',
            client_addr: request?.ip,
            application_name: 'Створення групи садочку',
            action_stamp_tx: new Date(),
            action_stamp_stm: new Date(),
            action_stamp_clk: new Date(),
            schema_name: 'ower',
            table_name: 'kindergarten_groups',
            oid: '16505',
        });

        return result;
    }

    async updateGroup(request) {
        const { id } = request.params;
        const updateData = request.body;

        // Перевіряємо чи існує група
        const existingGroup = await KindergartenRepository.getGroupById(id);
        if (!existingGroup || existingGroup.length === 0) {
            throw new Error('Групу не знайдено');
        }

        // Якщо змінюється назва групи, перевіряємо на дублікати
        if (updateData.group_name && updateData.kindergarten_name) {
            const duplicateGroup = await KindergartenRepository.getGroupByNameAndKindergarten(
                updateData.group_name, 
                updateData.kindergarten_name,
                id // виключаємо поточну групу
            );

            if (duplicateGroup && duplicateGroup.length > 0) {
                throw new Error('Група з такою назвою вже існує в цьому садочку');
            }
        }

        const result = await KindergartenRepository.updateGroup(id, updateData);

        // Логування оновлення
        await logRepository.createLog({
            row_pk_id: id,
            uid: request?.user?.id,
            action: 'UPDATE',
            client_addr: request?.ip,
            application_name: 'Оновлення групи садочку',
            action_stamp_tx: new Date(),
            action_stamp_stm: new Date(),
            action_stamp_clk: new Date(),
            schema_name: 'ower',
            table_name: 'kindergarten_groups',
            oid: '16505',
        });

        return result;
    }

    async deleteGroup(request) {
        const { id } = request.params;

        // Перевіряємо чи існує група
        const existingGroup = await KindergartenRepository.getGroupById(id);
        if (!existingGroup || existingGroup.length === 0) {
            throw new Error('Групу не знайдено');
        }

        const result = await KindergartenRepository.deleteGroup(id);

        // Логування видалення
        await logRepository.createLog({
            row_pk_id: id,
            uid: request?.user?.id,
            action: 'DELETE',
            client_addr: request?.ip,
            application_name: 'Видалення групи садочку',
            action_stamp_tx: new Date(),
            action_stamp_stm: new Date(),
            action_stamp_clk: new Date(),
            schema_name: 'ower',
            table_name: 'kindergarten_groups',
            oid: '16505',
        });

        return result;
    }

    // ===============================
    // МЕТОДИ ДЛЯ ДІТЕЙ САДОЧКА
    // ===============================

    async findChildrenByFilter(request) {
        const { 
            page = 1, 
            limit = 16, 
            sort_by = 'id', 
            sort_direction = 'desc',
            child_name,
            parent_name,
            phone_number,
            group_id,
            ...whereConditions 
        } = request.body;

        const { offset } = paginate(page, limit);
        
        // Логування пошуку якщо є параметри фільтрації
        if (child_name || parent_name || phone_number || group_id) {
            await logRepository.createLog({
                row_pk_id: null,
                uid: request?.user?.id,
                action: 'SEARCH',
                client_addr: request?.ip,
                application_name: 'Пошук дітей садочку',
                action_stamp_tx: new Date(),
                action_stamp_stm: new Date(),
                action_stamp_clk: new Date(),
                schema_name: 'ower',
                table_name: 'children_roster',
                oid: '16506',
            });
        }

        const userData = await KindergartenRepository.findChildrenByFilter({
            limit,
            offset,
            sort_by,
            sort_direction,
            child_name,
            parent_name,
            phone_number,
            group_id,
            ...whereConditions
        });

        return paginationData(userData[0], page, limit);
    }

    async getChildById(request) {
        const { id } = request.params;
        
        const childData = await KindergartenRepository.getChildById(id);
        if (!childData || childData.length === 0) {
            throw new Error('Дитину не знайдено');
        }

        return childData[0];
    }

    async createChild(request) {
        const {
            child_name,
            parent_name,
            phone_number,
            group_id
        } = request.body;

        // Перевіряємо чи існує група
        const existingGroup = await KindergartenRepository.getGroupById(group_id);
        if (!existingGroup || existingGroup.length === 0) {
            throw new Error('Група не знайдена');
        }

        // Перевіряємо чи не існує дитина з таким же ПІБ в тій же групі
        const existingChild = await KindergartenRepository.getChildByNameAndGroup(
            child_name, 
            group_id
        );

        if (existingChild && existingChild.length > 0) {
            throw new Error('Дитина з таким ПІБ вже існує в цій групі');
        }

        const childData = {
            child_name,
            parent_name,
            phone_number,
            group_id,
            created_at: new Date()
        };

        const result = await KindergartenRepository.createChild(childData);

        // Логування створення дитини
        await logRepository.createLog({
            row_pk_id: result.insertId || result.id,
            uid: request?.user?.id,
            action: 'INSERT',
            client_addr: request?.ip,
            application_name: 'Створення запису дитини',
            action_stamp_tx: new Date(),
            action_stamp_stm: new Date(),
            action_stamp_clk: new Date(),
            schema_name: 'ower',
            table_name: 'children_roster',
            oid: '16506',
        });

        return result;
    }

    async updateChild(request) {
        const { id } = request.params;
        const updateData = request.body;

        // Перевіряємо чи існує дитина
        const existingChild = await KindergartenRepository.getChildById(id);
        if (!existingChild || existingChild.length === 0) {
            throw new Error('Дитину не знайдено');
        }

        // Якщо змінюється група, перевіряємо чи вона існує
        if (updateData.group_id) {
            const existingGroup = await KindergartenRepository.getGroupById(updateData.group_id);
            if (!existingGroup || existingGroup.length === 0) {
                throw new Error('Група не знайдена');
            }
        }

        // Якщо змінюється ПІБ дитини та група, перевіряємо на дублікати
        if (updateData.child_name && updateData.group_id) {
            const duplicateChild = await KindergartenRepository.getChildByNameAndGroup(
                updateData.child_name, 
                updateData.group_id,
                id // виключаємо поточну дитину
            );

            if (duplicateChild && duplicateChild.length > 0) {
                throw new Error('Дитина з таким ПІБ вже існує в цій групі');
            }
        }

        const result = await KindergartenRepository.updateChild(id, updateData);

        // Логування оновлення
        await logRepository.createLog({
            row_pk_id: id,
            uid: request?.user?.id,
            action: 'UPDATE',
            client_addr: request?.ip,
            application_name: 'Оновлення даних дитини',
            action_stamp_tx: new Date(),
            action_stamp_stm: new Date(),
            action_stamp_clk: new Date(),
            schema_name: 'ower',
            table_name: 'children_roster',
            oid: '16506',
        });

        return result;
    }

    async deleteChild(request) {
        const { id } = request.params;

        // Перевіряємо чи існує дитина
        const existingChild = await KindergartenRepository.getChildById(id);
        if (!existingChild || existingChild.length === 0) {
            throw new Error('Дитину не знайдено');
        }

        const result = await KindergartenRepository.deleteChild(id);

        // Логування видалення
        await logRepository.createLog({
            row_pk_id: id,
            uid: request?.user?.id,
            action: 'DELETE',
            client_addr: request?.ip,
            application_name: 'Видалення запису дитини',
            action_stamp_tx: new Date(),
            action_stamp_stm: new Date(),
            action_stamp_clk: new Date(),
            schema_name: 'ower',
            table_name: 'children_roster',
            oid: '16506',
        });

        return result;
    }
}

module.exports = new KindergartenService();