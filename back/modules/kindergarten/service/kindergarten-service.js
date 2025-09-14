
const KindergartenRepository = require("../repository/kindergarten-repository");
const { fieldsListMissingError, NotFoundErrorMessage } = require("../../../utils/messages")
const { paginate, paginationData, addRequisiteToLandDebt } = require("../../../utils/function");
const { displayKindergartenFields, allowedKindergartenTableFilterFields } = require("../../../utils/constants");
const { createRequisiteWord } = require("../../../utils/generateDocx");
const logRepository = require("../../log/repository/log-repository");

class KindergartenService {

    async getDebtByDebtorId(request) {
        if (!Object.keys([displayKindergartenFields]).length) {
            throw new Error(fieldsListMissingError)
        }
        return await KindergartenRepository.getDebtByDebtorId(request?.params?.id, displayKindergartenFields)
    }

    async findDebtByFilter(request) {
        const { page = 1, limit = 16, title, ...whereConditions } = request.body
        const { offset } = paginate(page, limit)
        const allowedFields = allowedKindergartenTableFilterFields.filter(el => whereConditions.hasOwnProperty(el)).reduce((acc, key) => ({ ...acc, [key]: whereConditions[key] }), {})
        const userData = await KindergartenRepository.findDebtByFilter(limit, offset, title, allowedFields, displayKindergartenFields)
        if (title || whereConditions?.child_name) {
            await logRepository.createLog({
                
                row_pk_id: null,
                uid: request?.user?.id,
                action: 'SEARCH',
                client_addr: request?.ip,
                application_name: 'Пошук боржника',
                action_stamp_tx: new Date(),
                action_stamp_stm: new Date(),
                action_stamp_clk: new Date(),
                schema_name: 'ower',
                table_name: 'ower',
                oid: '16504',
            })
        }
        return paginationData(userData[0], page, limit)
    }

    async generateWordByDebtId(request, reply) {
        if (!Object.keys([displayKindergartenFields]).length) {
            throw new Error(fieldsListMissingError)
        }
        const fetchData = await KindergartenRepository.getDebtByDebtorId(request?.params?.id, displayKindergartenFields)
        if (!fetchData.length) {
            throw new Error(NotFoundErrorMessage)
        }
        const fetchRequisite = await KindergartenRepository.getRequisite()
        if (!fetchRequisite.length) {
            throw new Error(NotFoundErrorMessage)
        }

        if (fetchData[0].debt_amount) {
            const result = await createRequisiteWord(fetchData[0], fetchRequisite[0])
            await logRepository.createLog({
                row_pk_id: fetchData[0].id,
                uid: request?.user?.id,
                action: 'GENERATE_DOC',
                client_addr: request?.ip,
                application_name: 'Генерування документа для боржника',
                action_stamp_tx: new Date(),
                action_stamp_stm: new Date(),
                action_stamp_clk: new Date(),
                schema_name: 'ower',
                table_name: 'ower',
                oid: '16504',
            })
            reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            reply.header('Content-Disposition', 'attachment; filename=generated.docx');
            return reply.send(result);
        }

        throw new Error("Немає даних для формування документу.")

    }

    async printDebtId(request, reply) {
        if (!Object.keys([displayKindergartenFields]).length) {
            throw new Error(fieldsListMissingError)
        }
        const fetchData = await KindergartenRepository.getDebtByDebtorId(request?.params?.id, displayKindergartenFields)
        if (!fetchData.length) {
            throw new Error(NotFoundErrorMessage)
        }
        const fetchRequisite = await KindergartenRepository.getRequisite()
        if (!fetchRequisite.length) {
            throw new Error(NotFoundErrorMessage)
        }

        if (fetchData[0].debt_amount) {
            const result = addRequisiteToLandDebt(fetchData[0], fetchRequisite[0]);
            await logRepository.createLog({
                row_pk_id: fetchData[0].id,
                uid: request?.user?.id,
                action: 'PRINT',
                client_addr: request?.ip,
                application_name: 'Друк документа',
                action_stamp_tx: new Date(),
                action_stamp_stm: new Date(),
                action_stamp_clk: new Date(),
                schema_name: 'ower',
                table_name: 'ower',
                oid: '16504',
            })
            return reply.send({
                name: fetchData[0].name,
                date: fetchData[0].date,
                identification: fetchData[0].identification,
                debt: result
            });
        }

        throw new Error("Немає даних для формування документу.")
    }

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
            action: 'CREATE',
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
}

module.exports = new KindergartenService();