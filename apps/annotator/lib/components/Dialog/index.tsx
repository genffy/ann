import { PreactDOMAttributes } from "preact";
import styles from './styles.module.css'

export function Dialog(props: PreactDOMAttributes) {
  return <div {...props} className={`${styles.dialog}`} />
}