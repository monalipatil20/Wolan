const phonePattern = /^[0-9+\-()\s]{7,20}$/;

const buildResult = (value, errors) => ({ value, errors });

const validateRegisterRider = (req) => {
  const errors = [];
  const value = {
    full_name: req.body.full_name ? String(req.body.full_name).trim() : null,
    phone: req.body.phone ? String(req.body.phone).trim() : null,
    hub_id: req.body.hub_id ? String(req.body.hub_id).trim() : null,
    bike_plate: req.body.bike_plate ? String(req.body.bike_plate).trim().toUpperCase() : null,
    nin_number: req.body.nin_number ? String(req.body.nin_number).trim().toUpperCase() : null,
    next_of_kin: req.body.next_of_kin
      ? {
          name: String(req.body.next_of_kin.name || '').trim(),
          phone: String(req.body.next_of_kin.phone || '').trim(),
          relationship: String(req.body.next_of_kin.relationship || '').trim(),
        }
      : null,
    bond_amount: req.body.bond_amount !== undefined ? Number(req.body.bond_amount) : 0,
  };

  if (!value.full_name || value.full_name.length < 2) errors.push('full_name is required');
  if (!phonePattern.test(value.phone || '')) errors.push('phone is invalid');
  if (!value.bike_plate || value.bike_plate.length < 2) errors.push('bike_plate is required');
  if (!value.nin_number || value.nin_number.length < 5) errors.push('nin_number is required');
  if (!value.next_of_kin) errors.push('next_of_kin is required');
  if (value.next_of_kin) {
    if (!value.next_of_kin.name || value.next_of_kin.name.length < 2) errors.push('next_of_kin.name is required');
    if (!phonePattern.test(value.next_of_kin.phone || '')) errors.push('next_of_kin.phone is invalid');
    if (!value.next_of_kin.relationship || value.next_of_kin.relationship.length < 2) errors.push('next_of_kin.relationship is required');
  }
  if (Number.isNaN(value.bond_amount) || value.bond_amount < 0) errors.push('bond_amount must be a positive number');

  return buildResult(value, errors);
};

const validateRiderQuery = (req) => {
  const value = {
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search ? String(req.query.search).trim() : undefined,
    hub_id: req.query.hub_id ? String(req.query.hub_id).trim() : undefined,
    current_status: req.query.current_status ? String(req.query.current_status).trim() : undefined,
    is_active: req.query.is_active ? String(req.query.is_active).trim() : undefined,
  };

  return buildResult(value, []);
};

const validateUpdateStatus = (req) => {
  const errors = [];
  const allowedStatuses = ['available', 'on_delivery', 'break', 'offline'];
  const value = {
    current_status: String(req.body.current_status || '').trim(),
  };

  if (!allowedStatuses.includes(value.current_status)) errors.push('current_status is invalid');

  return buildResult(value, errors);
};

const validateGpsLocation = (req) => {
  const errors = [];
  const value = {
    latitude: Number(req.body.latitude),
    longitude: Number(req.body.longitude),
  };

  if (Number.isNaN(value.latitude)) errors.push('latitude is required');
  if (Number.isNaN(value.longitude)) errors.push('longitude is required');
  if (!Number.isNaN(value.latitude) && (value.latitude < -90 || value.latitude > 90)) errors.push('latitude must be between -90 and 90');
  if (!Number.isNaN(value.longitude) && (value.longitude < -180 || value.longitude > 180)) errors.push('longitude must be between -180 and 180');

  return buildResult(value, errors);
};

const validateDocumentUpload = (req) => {
  const errors = [];
  const allowedTypes = ['license', 'insurance', 'bike_registration', 'id_card', 'other'];
  const value = {
    document_type: String(req.body.document_type || '').trim(),
    url: req.body.url ? String(req.body.url).trim() : null,
    public_id: req.body.public_id ? String(req.body.public_id).trim() : null,
  };

  if (!allowedTypes.includes(value.document_type)) errors.push('document_type is invalid');
  if (!value.url) errors.push('url is required');

  return buildResult(value, errors);
};

const validateVerifyDocument = (req) => {
  const errors = [];
  const allowedTypes = ['license', 'insurance', 'bike_registration', 'id_card', 'other'];
  const value = {
    document_type: String(req.body.document_type || '').trim(),
    verified: req.body.verified === true || req.body.verified === 'true',
  };

  if (!allowedTypes.includes(value.document_type)) errors.push('document_type is invalid');

  return buildResult(value, errors);
};

const validateRegisterBond = (req) => {
  const errors = [];
  const value = {
    bond_amount: Number(req.body.bond_amount),
  };

  if (Number.isNaN(value.bond_amount) || value.bond_amount < 0) errors.push('bond_amount must be a positive number');

  return buildResult(value, errors);
};

const validateIssueFine = (req) => {
  const errors = [];
  const value = {
    amount: Number(req.body.amount),
    reason: String(req.body.reason || '').trim(),
  };

  if (Number.isNaN(value.amount) || value.amount <= 0) errors.push('amount must be a positive number');
  if (value.reason.length < 3) errors.push('reason is required');

  return buildResult(value, errors);
};

const validateIncident = (req) => {
  const errors = [];
  const allowedTypes = ['accident', 'theft', 'complaint', 'lost_package', 'damage', 'medical', 'other'];
  const value = {
    type: String(req.body.type || '').trim(),
    description: String(req.body.description || '').trim(),
    location: req.body.location ? String(req.body.location).trim() : null,
  };

  if (!allowedTypes.includes(value.type)) errors.push('type is invalid');
  if (value.description.length < 5) errors.push('description is required');

  return buildResult(value, errors);
};

const validateResolveIncident = (req) => {
  const errors = [];
  const value = {
    resolution: String(req.body.resolution || '').trim(),
  };

  if (value.resolution.length < 3) errors.push('resolution is required');

  return buildResult(value, errors);
};

const validateEarningsQuery = (req) => {
  const value = {
    from: req.query.from ? String(req.query.from).trim() : undefined,
    to: req.query.to ? String(req.query.to).trim() : undefined,
    date: req.query.date ? String(req.query.date).trim() : undefined,
  };

return buildResult(value, []);
};

module.exports = {
  validateRegisterRider,
  validateRiderQuery,
  validateUpdateStatus,
  validateGpsLocation,
  validateDocumentUpload,
  validateVerifyDocument,
  validateRegisterBond,
  validateIssueFine,
  validateIncident,
  validateResolveIncident,
  validateEarningsQuery,
};
