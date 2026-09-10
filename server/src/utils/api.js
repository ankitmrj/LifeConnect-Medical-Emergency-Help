export const ok = (res, data = {}, message = 'Operation successful', status = 200) =>
  res.status(status).json({ success: true, message, data });

export const fail = (res, message, error = 'ERROR', status = 400) =>
  res.status(status).json({ success: false, message, error });
