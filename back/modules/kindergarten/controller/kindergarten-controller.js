const kindergartenService = require("../service/kindergarten-service");
const Logger = require("../../../utils/logger")

class KindergartenController {

    async getDebtByDebtorId(request, reply) {
        try {
            const debtData = await kindergartenService.getDebtByDebtorId(request)
            return reply.send(debtData)
        } catch (error) {
            Logger.error(error.message, { stack: error.stack })
            reply.status(400).send(error)
        }
    }

    async findDebtByFilter(request, reply) {
        try {
	    //console.log("request",request.body)
            const debtData = await kindergartenService.findDebtByFilter(request)
            return reply.send(debtData)
        } catch (error) {
            Logger.error(error.message, { stack: error.stack })
            reply.status(400).send(error)
        }
    }

    async generateWordByDebtId(request, reply) {
        try {
            const debtData = await kindergartenService.generateWordByDebtId(request, reply)
            return reply.send(debtData)
        } catch (error) {
            Logger.error(error.message, { stack: error.stack })
            reply.status(400).send(error)
        }
    }

    async printDebtId(request, reply) {
        try {
            const debtData = await kindergartenService.printDebtId(request, reply)
            return reply.send(debtData)
        } catch (error) {
            Logger.error(error.message, { stack: error.stack })
            reply.status(400).send(error)
        }
    }

    async findGroupsByFilter(request, reply) {
        try {
            const data = await kindergartenService.findGroupsByFilter(request)
            reply.status(200).send(data)
        } catch (error) {
            Logger.error(error.message, { stack: error.stack })
            reply.status(400).send({ 
                error: 'Failed to fetch kindergarten groups',
                message: error.message 
            })
        }
    }

    async createGroup(request, reply) {
        try {
            const result = await kindergartenService.createGroup(request)
            reply.status(201).send({ 
                message: 'Групу створено успішно',
                data: result 
            })
        } catch (error) {
            Logger.error(error.message, { stack: error.stack })
            
            // Перевіряємо на дублікат назви групи
            if (error.message.includes('існує')) {
                return reply.status(409).send({ 
                    error: 'Conflict',
                    message: error.message 
                })
            }
            
            reply.status(400).send({ 
                error: 'Failed to create kindergarten group',
                message: error.message 
            })
        }
    }
}


module.exports = new KindergartenController();