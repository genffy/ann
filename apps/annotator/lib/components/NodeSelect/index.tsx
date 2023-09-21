import { PreactDOMAttributes } from "preact";
import styles from './styles.module.css'

export function NodeSelect(props: PreactDOMAttributes) {
  return <div {...props} className={`${styles.nodeSelect}`} />
}