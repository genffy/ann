import { PreactDOMAttributes } from "preact";
import styles from './styles.module.css'

export function Selection(props: PreactDOMAttributes) {
  return <div {...props} className={`${styles.selection}`} />
}