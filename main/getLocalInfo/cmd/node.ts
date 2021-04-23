import * as execa from 'execa';
import * as fse from 'fs-extra';
import * as path from 'path';
import getLocalToolInfo from './tool';
import { INodeVersionManagerInfo } from '../../types';
import { PACKAGE_JSON_FILE_NAME } from '../../constants';

function getLocalNodeInfo(
  name: string,
  latestVersion: string | null,
  options: { [k: string]: any},
) {
  const { managerName } = options;
  let localNodeInfo = getLocalToolInfo(name, latestVersion);

  let nodeManagerInfo: INodeVersionManagerInfo = { managerPath: null, managerVersion: null };
  if (managerName === 'nvm') {
    nodeManagerInfo = getNvmInfo();
  }

  localNodeInfo = Object.assign(localNodeInfo, nodeManagerInfo);
  if (!(nodeManagerInfo.managerPath && nodeManagerInfo.managerVersion)) {
    localNodeInfo.warningMessage =
      `检测到你已经安装了 Node.js，但未安装 ${managerName}. 推荐安装 ${managerName} 以更好管理 Node.js 版本。`;
    localNodeInfo.versionStatus = 'notInstalled';
  }

  return localNodeInfo;
}

function getNvmInfo(): INodeVersionManagerInfo {
  const nvmInfo: INodeVersionManagerInfo = {
    managerPath: null,
    managerVersion: null,
  };
  const nvmDirRes = execa.sync('echo', ['"$NVM_DIR"'], { shell: true });
  if (nvmDirRes) {
    const nvmDir = nvmDirRes.stdout;
    nvmInfo.managerPath = nvmDir;

    const nvmPackageJsonPath = path.join(nvmDir, PACKAGE_JSON_FILE_NAME);
    if (fse.pathExistsSync(nvmPackageJsonPath)) {
      const nvmPkgJSON = fse.readJSONSync(nvmPackageJsonPath) || {};
      const { version } = nvmPkgJSON;
      nvmInfo.managerVersion = version;
    }
  }

  return nvmInfo;
}


export default getLocalNodeInfo;
