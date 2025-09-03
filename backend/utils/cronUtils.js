const cron = require('node-cron');
const postService = require('../modules/post-owner/services/postService');
const db = require('../models/index');
const config = require('../configs/index');
const {Op, col} = require('sequelize');

class CronUtils {
    constructor() {
        this.jobs = new Map();
    }
    start() {
        this.scheduleContentApproval();
        console.log('Cron jobs started');
    }
    stop() {
        this.jobs.forEach((job) => job.stop());
        console.log('Cron jobs stopped');
        this.jobs.clear();
    }

    scheduleContentApproval() {
        const jobFn = async () => {
            const posts = await db.Post.findAll({
                where: {
                    status: config.config.statuspostenum.PENDING,
                    original_postid: { [Op.eq]: col("postid") },
                    createdAt: {
                        [Op.lte]: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) 
                    }
                },
                attributes: ['postid']

            });
            console.log(`[ContentApproval] Executed, found ${posts.length} pending posts`);
            const CONCURRENCY = 5;  // 5 posts run at the same time.
            for (let i = 0; i < posts.length; i += CONCURRENCY) {
                const slice = posts.slice(i, i + CONCURRENCY);
                await Promise.all(slice.map(p => postService.processContentApproval(p.postid)));
            }
        };
        jobFn();
        const job = cron.schedule("0 2 * * *", jobFn, {
            timezone: 'Asia/Ho_Chi_Minh'
        });
        this.jobs.set("contentApproval", job);
    }
}

module.exports = new CronUtils();
