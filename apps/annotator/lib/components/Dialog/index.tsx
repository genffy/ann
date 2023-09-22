import { Component } from "preact";
import styles from './styles.module.css'

export class Dialog extends Component {
  render(props) {
    return <div {...props} className={`${styles.dialog}`} >xxxx</div>
  }
}