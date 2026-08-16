// const enum NodeEnvironment {
//   DEV = 'DEVELOPMENT',
//   PROD = 'PRODUCTION',
//   TEST = 'TEST',
// }

export type AppConfig = {
  nodeEnv: string;
  port: number;
  corsOigins: string[];
};
