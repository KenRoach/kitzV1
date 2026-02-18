import Fastify from 'fastify';
export const health={status:'ok'};
const app=Fastify();
app.get('/dashboard',async()=>({apiKeysConfigured:0,credits:100,approvalsPending:0}));
app.listen({port:Number(process.env.PORT||3011),host:'0.0.0.0'});
