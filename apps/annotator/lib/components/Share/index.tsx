import { Component, PreactDOMAttributes } from "preact";
import styles from './styles.module.css'

export class Share extends Component {
  render(props) {
    return (
      <div {...props} className={`${styles.share}`} >据说可以用来分享的</div>
    )
  }
}