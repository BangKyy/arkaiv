import { Component } from 'react'
import { ArrowClockwise } from './icons'
import Button from './Button'
import t from '../i18n/id'

/**
 * If the map code fails to download or crashes, show a retry message in the map
 * area and keep the studio list working (PRD section 7, empty and error states).
 */
export default class MapBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="map-error" role="alert">
        <p className="map-error__title">{t.map.errorTitle}</p>
        <p>{t.map.errorBody}</p>
        <Button
          variant="outlined"
          icon={ArrowClockwise}
          iconPosition="left"
          onClick={() => window.location.reload()}
        >
          {t.map.retry}
        </Button>
      </div>
    )
  }
}
