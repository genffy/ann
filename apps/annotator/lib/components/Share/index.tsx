import { PreactDOMAttributes } from "preact";
import styles from './styles.module.css'

export function Share(props: PreactDOMAttributes) {
  return <div {...props} className={`${styles.share}`} />
}