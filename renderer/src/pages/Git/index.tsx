import { useEffect } from 'react';
import { Button, Message } from '@alifd/next';
import PageHeader from '@/components/PageHeader';
import styles from './index.module.scss';
import GlobalGitConfig from './components/GlobalGitConfig';
import UserGitConfigs from './components/UserGitConfigs';
import UserGitConfigDialogForm from './components/UserGitConfigDialogForm';
import store from './store';

function Git() {
  const [state, dispatcher] = store.useModel('git');
  const effectsState = store.useModelEffectsState('git');

  const { userGitConfigFormVisible, userGitConfigFormType } = state;

  const addConfigBtn = (
    <Button
      type="primary"
      onClick={() => {
        dispatcher.setUserGitConfigFormVisible(true);
        dispatcher.setUserGitConfigFormType('add');
      }}
    >
      新增配置
    </Button>
  );

  useEffect(() => {
    if (effectsState.addUserGitConfig.error) {
      Message.error(effectsState.addUserGitConfig.error.message);
    }
  }, [effectsState.addUserGitConfig.error]);

  return (
    <div className={styles.container}>
      <PageHeader title="Git 管理" button={addConfigBtn} />
      <div className={styles.content}>
        <GlobalGitConfig />
        <UserGitConfigs />
      </div>
      {userGitConfigFormType === 'add' && (
        <UserGitConfigDialogForm
          type="add"
          visible={userGitConfigFormVisible}
          onSubmit={dispatcher.addUserGitConfig}
          onVisibleChange={dispatcher.setUserGitConfigFormVisible}
        />
      )}
    </div>
  );
}

export default Git;
