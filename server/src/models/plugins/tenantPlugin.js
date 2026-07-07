const mongoose = require('mongoose');
const { tenantStorage } = require('../../middleware/tenant');

module.exports = function tenantPlugin(schema) {
  // 1. Add companyId field to the schema
  schema.add({
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true
    }
  });

  // 2. Intercept queries to inject companyId filter
  const injectCompanyId = function(next) {
    // If the query explicitly sets the bypassTenant option, skip filtering
    if (this.options && this.options.bypassTenant) {
      return next();
    }

    const store = tenantStorage.getStore();
    
    // If a tenant context exists, inject companyId
    if (store && store.companyId) {
      const query = this.getQuery();
      
      // Only set if companyId is not already explicitly queried
      if (query.companyId === undefined) {
        this.where({ companyId: store.companyId });
      }
    }
    next();
  };

  // Bind to query middleware hooks
  const hooks = [
    'find',
    'findOne',
    'countDocuments',
    'updateOne',
    'updateMany',
    'findOneAndUpdate',
    'deleteOne',
    'deleteMany',
    'findOneAndDelete'
  ];

  hooks.forEach(hook => {
    schema.pre(hook, injectCompanyId);
  });

  // Intercept aggregations to inject companyId match stage
  schema.pre('aggregate', function(next) {
    if (this.options && this.options.bypassTenant) {
      return next();
    }

    const store = tenantStorage.getStore();
    if (store && store.companyId) {
      this.pipeline().unshift({
        $match: { companyId: new mongoose.Types.ObjectId(store.companyId) }
      });
    }
    next();
  });
  
  // 3. For save operations (creation), automatically inject companyId if available
  schema.pre('save', function(next) {
    const store = tenantStorage.getStore();
    if (store && store.companyId && !this.companyId) {
      this.companyId = store.companyId;
    }
    next();
  });
};
