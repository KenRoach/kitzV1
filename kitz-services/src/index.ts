import Fastify from 'fastify';
export const health={status:'ok'};
const app=Fastify();
app.get('/',async()=>({service:'kitz-services',hub:'free ai business content'}));
app.listen({port:Number(process.env.PORT||3010),host:'0.0.0.0'});
