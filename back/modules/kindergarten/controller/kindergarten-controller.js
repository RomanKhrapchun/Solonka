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

    // ===============================
    // МЕТОДИ ДЛЯ ГРУП САДОЧКА
    // ===============================

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

    async updateGroup(request, reply) {
        try {
            const result = await kindergartenService.updateGroup(request)
            reply.status(200).send({ 
                message: 'Групу оновлено успішно',
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

            // Перевіряємо чи група існує
            if (error.message.includes('не знайдено')) {
                return reply.status(404).send({ 
                    error: 'Not Found',
                    message: error.message 
                })
            }
            
            reply.status(400).send({ 
                error: 'Failed to update kindergarten group',
                message: error.message 
            })
        }
    }

    async deleteGroup(request, reply) {
        try {
            await kindergartenService.deleteGroup(request)
            reply.status(200).send({ 
                message: 'Групу видалено успішно'
            })
        } catch (error) {
            Logger.error(error.message, { stack: error.stack })
            
            // Перевіряємо чи група існує
            if (error.message.includes('не знайдено')) {
                return reply.status(404).send({ 
                    error: 'Not Found',
                    message: error.message 
                })
            }
            
            reply.status(400).send({ 
                error: 'Failed to delete kindergarten group',
                message: error.message 
            })
        }
    }

    // ===============================
    // МЕТОДИ ДЛЯ ДІТЕЙ САДОЧКА
    // ===============================

    async findChildrenByFilter(request, reply) {
        try {
            const data = await kindergartenService.findChildrenByFilter(request)
            reply.status(200).send(data)
        } catch (error) {
            Logger.error(error.message, { stack: error.stack })
            reply.status(400).send({ 
                error: 'Failed to fetch children',
                message: error.message 
            })
        }
    }

    async getChildById(request, reply) {
        try {
            const data = await kindergartenService.getChildById(request)
            reply.status(200).send(data)
        } catch (error) {
            Logger.error(error.message, { stack: error.stack })
            
            if (error.message.includes('не знайдено')) {
                return reply.status(404).send({ 
                    error: 'Not Found',
                    message: error.message 
                })
            }
            
            reply.status(400).send({ 
                error: 'Failed to fetch child',
                message: error.message 
            })
        }
    }

    async createChild(request, reply) {
        try {
            const result = await kindergartenService.createChild(request)
            reply.status(201).send({ 
                message: 'Дитину створено успішно',
                data: result 
            })
        } catch (error) {
            Logger.error(error.message, { stack: error.stack })
            
            // Перевіряємо на дублікат
            if (error.message.includes('вже існує')) {
                return reply.status(409).send({ 
                    error: 'Conflict',
                    message: error.message 
                })
            }

            // Перевіряємо на неіснуючу групу
            if (error.message.includes('Група не знайдена')) {
                return reply.status(404).send({ 
                    error: 'Group Not Found',
                    message: error.message 
                })
            }
            
            reply.status(400).send({ 
                error: 'Failed to create child',
                message: error.message 
            })
        }
    }

    async updateChild(request, reply) {
        try {
            const result = await kindergartenService.updateChild(request)
            reply.status(200).send({ 
                message: 'Дані дитини оновлено успішно',
                data: result 
            })
        } catch (error) {
            Logger.error(error.message, { stack: error.stack })
            
            // Перевіряємо на дублікат
            if (error.message.includes('вже існує')) {
                return reply.status(409).send({ 
                    error: 'Conflict',
                    message: error.message 
                })
            }

            // Перевіряємо чи дитина існує
            if (error.message.includes('не знайдено')) {
                return reply.status(404).send({ 
                    error: 'Not Found',
                    message: error.message 
                })
            }

            // Перевіряємо на неіснуючу групу
            if (error.message.includes('Група не знайдена')) {
                return reply.status(404).send({ 
                    error: 'Group Not Found',
                    message: error.message 
                })
            }
            
            reply.status(400).send({ 
                error: 'Failed to update child',
                message: error.message 
            })
        }
    }

    async deleteChild(request, reply) {
        try {
            await kindergartenService.deleteChild(request)
            reply.status(200).send({ 
                message: 'Дитину видалено успішно'
            })
        } catch (error) {
            Logger.error(error.message, { stack: error.stack })
            
            // Перевіряємо чи дитина існує
            if (error.message.includes('не знайдено')) {
                return reply.status(404).send({ 
                    error: 'Not Found',
                    message: error.message 
                })
            }
            
            reply.status(400).send({ 
                error: 'Failed to delete child',
                message: error.message 
            })
        }
    }
}

module.exports = new KindergartenController();