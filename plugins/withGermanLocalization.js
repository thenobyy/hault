const { withXcodeProject } = require("@expo/config-plugins");

module.exports = function withGermanLocalization(config) {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    project.addKnownRegion("de");
    return config;
  });
};
