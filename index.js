const configs = {};
const handlers = {};
const values = {};

const countObjProperties = (obj) => Object.keys(obj).length

const flatten = (data) => {
  const result = {};

  const recurse = (cur, prop) => {
    if (Object(cur) !== cur) {
      result[prop] = cur;
    } else if (Array.isArray(cur)) {
      const l = cur.length;
      for (let i = 0; i < l; i++)
        recurse(cur[i], prop + "[" + i + "]");
      if (l === 0) result[prop] = [];
    } else {
      let isEmpty = true;
      for (let p in cur) {
        isEmpty = false;
        recurse(cur[p], prop ? prop + "." + p : p);
      }
      if (isEmpty && prop) result[prop] = {};
    }
  }
  recurse(data, "");
  return result;
};

const processValues = (newValues, sConfName) => {
  return Promise.resolve()
  .then(() => {
    const oOldValues = values[sConfName] || {};
    values[sConfName] = newValues;

    if (handlers[sConfName] && countObjProperties(handlers[sConfName])) {
      const difference = Object.keys(newValues).filter(k => newValues[k] !== oOldValues[k]);
      for (let j = 0; j < difference.length; j++) {
        const key = difference[j];

        if (handlers[sConfName][key]) {
          for (let i = 0; i < handlers[sConfName][key].length; i++) {
            handlers[sConfName][key][i](newValues[key], key)
          }
        }
      }
    }
  });
}

const config = {
  fromES(client, index, type, id, interval, configName) {
    const sConfName = configName || "default";

    if (configs[sConfName])
      throw new Error("configuration with this name already setup");

    const newConf = {
      type: "es",
      settings: {
        index,
        type,
        id
      },
      refresh_interval: interval || (60 * 1000),
    }

    const fInterval = () => {
      return client.get({
        index,
        type,
        id
      })
      .then(response => response.body._source)
      .then(newValues => processValues(newValues, sConfName))
    }

    newConf.interval = setInterval(fInterval, newConf.refresh_interval);
    fInterval();

    configs[sConfName] = newConf;
  },
  fromS3(oS3, Bucket, Key, interval, configName) {
    const sConfName = configName || "default";

    if (configs[sConfName])
      throw new Error("configuration with this name already setup");

    const newConf = {
      type: "s3",
      settings: {
        Key,
        Bucket
      },
      refresh_interval: interval || (60 * 1000),
    }

    const fInterval = () => {
      return oS3.getObject({
          Bucket,
          Key
        })
        .promise()
        .then(resp => flatten(JSON.parse(resp.Body.toString())))
        .then(newValues => processValues(newValues, sConfName))
    }

    newConf.interval = setInterval(fInterval, newConf.refresh_interval);
    fInterval();

    configs[sConfName] = newConf;
  }
}

const handler = {
  onChange(key, handler, configName) {
    const sConfName = configName || "default";

    if (!handlers[sConfName])
      handlers[sConfName] = {};

    if (!handlers[sConfName][key])
      handlers[sConfName][key] = [];

    handlers[sConfName][key].push(handler);
  }
}




module.exports = {
  config,
  handler
}
