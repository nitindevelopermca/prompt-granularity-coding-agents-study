// Minimum authenticated application shell: shared header + a single <main>
// landmark that hosts each authenticated destination (Products, Cart, ...).

import { Outlet } from 'react-router-dom';
import AppHeader from './AppHeader';
import styles from './AppLayout.module.css';

export default function AppLayout() {
  return (
    <div className={styles.shell}>
      <AppHeader />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
