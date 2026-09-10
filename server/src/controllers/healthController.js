import mongoose from 'mongoose';

export const getHealth = (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.status(200).json({
    status: 'ok',
    service: 'RozgaarSetu API',
    mongodb: dbStatusMap[dbState] || 'unknown',
    timestamp: new Date().toISOString(),
  });
};
