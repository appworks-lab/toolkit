import { ipcMain } from 'electron';
import * as child_process from 'child_process';
import { IpcMainInvokeEvent } from 'electron/main';
import * as fse from 'fs-extra';
import * as path from 'path';
import { IBasicPackageInfo, IPackageInfo } from './types';
import { getLocalCmdInfo, getLocalDmgInfo } from './getLocalInfo';
import { send as sendMainWindow } from './window';
// import installPackage from './utils/installPackage';

const getLocalInfoFuncMap = {
  dmg: getLocalDmgInfo,
  cmd: getLocalCmdInfo,
};

const childProcessMap = new Map();

export default () => {
  ipcMain.handle('get-base-packages', async () => {
    // TODO: get data.json from OSS and save it in the storage
    const data = await fse.readJSON(path.join(__dirname, 'data.json'));
    const { bases }: { bases: IBasicPackageInfo[] } = data;
    const packagesData = bases.map((basePackageInfo: IBasicPackageInfo) => {
      const getLocalInfoFunc = getLocalInfoFuncMap[basePackageInfo.type];
      if (getLocalInfoFunc) {
        const localPackageInfo = getLocalInfoFunc(basePackageInfo);
        return { ...basePackageInfo, ...localPackageInfo };
      }
      return basePackageInfo;
    });

    return packagesData;
  });

  ipcMain.handle('get-install-base-package-status', (event: IpcMainInvokeEvent, installChannel: string) => {

  });

  ipcMain.handle('install-base-package', async (
    event: IpcMainInvokeEvent,
    { packagesList, installChannel, processChannel }: { packagesList: IPackageInfo[]; installChannel: string; processChannel: string},
  ) => {
    console.log('packagesList:', packagesList);
    // TODO warning
    // if (childProcessMap.get(installChannel)) {
    //   return;
    // }
    // fork a child process to install package
    const childProcess = child_process.fork(path.join(__dirname, 'utils/installPackage'));
    childProcessMap.set(installChannel, childProcess);
    childProcess.send({ packagesList, installChannel, processChannel });
    childProcess.on('message', ({ channel, data }: any) => {
      sendMainWindow(channel, data);
    });
  });

  ipcMain.handle('cancel-install-base-package', async (event: IpcMainInvokeEvent, channelName: string) => {
    const childProcess = childProcessMap.get(channelName);
    if (childProcess && childProcess.kill) {
      // kill child process
      childProcess.kill();
    }
  });
};