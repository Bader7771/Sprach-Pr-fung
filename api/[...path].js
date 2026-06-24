let app;
let connectDB;
let dbConnection;

module.exports = async function handler(req, res) {
  if (!app || !connectDB) {
    [{ default: app }, { connectDB }] = await Promise.all([
      import('../server/src/server.js'),
      import('../server/src/config/db.js')
    ]);
  }

  if (!req.url.startsWith('/api/')) {
    const pathParam = req.query?.path;
    const path = Array.isArray(pathParam) ? pathParam.join('/') : pathParam;
    req.url = `/api/${path || ''}`;
  }

  dbConnection ||= connectDB();
  await dbConnection;
  return app(req, res);
};
