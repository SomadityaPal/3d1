/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function Underlay() {
  return (
    <div
      id="underlay"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        padding: 40,
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        pointerEvents: "none",
        zIndex: 0,
      }}>
      <div style={{ width: "100%", padding: 0, display: "inline-flex", flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
        <p
          id="brand-name"
          style={{
            fontFamily: "'Antonio', sans-serif",
            flex: "1 1 0%",
            height: 30,
            fontSize: 30,
            fontWeight: "700",
            lineHeight: "30px",
            color: "black",
            letterSpacing: -2,
          }}>
          POIMANDRES
        </p>
        <div style={{ flex: "1 1 0%", display: "flex", gap: "2em" }}></div>
        <p id="symbol-right" style={{ flex: "1 1 0%", height: 30, fontSize: 30, lineHeight: "30px", textAlign: "right", color: "black" }}>⎑</p>
      </div>
      <div style={{ height: 60 }} />
      <div style={{ width: "100%", padding: 0, display: "inline-flex", flexDirection: "row", alignItems: "flex-start", justifyContent: "center" }}>
        <p id="description-left" style={{ flex: "1 1 0%", height: "100%", fontSize: 12, lineHeight: "1.5em", color: "black" }}>
          <b>Stones, Metals and Gems</b>
          <br />
          A Universal Deity
          <br />
          <b>—</b>
        </p>
        <div style={{ width: 10 }} />
        <p
          id="instruction-right"
          style={{
            transform: "rotate3d(0, 0, 1, 90deg) translate3d(100%,10px,0)",
            transformOrigin: "right",
            fontSize: 12,
            fontWeight: "700",
            lineHeight: "100%",
            textAlign: "right",
            color: "black",
            whiteSpace: "nowrap",
          }}>
          DRAG POINTER &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ●
        </p>
      </div>
      <div style={{ height: 10 }} />
      <div
        id="main-numbers"
        className="full"
        style={{
          fontFamily: "'Antonio', sans-serif",
          width: "100%",
          flex: "1 1 0%",
          padding: 0,
          display: "inline-flex",
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "center",
        }}>
        <p id="letter-x" style={{ flex: "1 1 0%", fontSize: 250, lineHeight: "1em", color: "black", margin: 0, letterSpacing: -10 }}>X</p>
        <div style={{ width: 10 }} />
        <p id="number-01" style={{ flex: "1 1 0%", fontSize: 250, lineHeight: "100%", textAlign: "right", color: "black", margin: 0, letterSpacing: -10 }}>_01</p>
      </div>
      <div style={{ height: 60 }} />
      <div
        id="bottom-row"
        style={{
          pointerEvents: "all",
          width: "100%",
          padding: 0,
          display: "inline-flex",
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "center",
        }}>
        <p id="bottom-left-text" className="full" style={{ whiteSpace: "nowrap", flex: "1 1 0%", fontSize: 12, lineHeight: "1.5em", color: "black" }}>
          <b>Wonders of Antiquity</b>
          <br />
          Pythagorean Mathematics
        </p>
        <div style={{ width: 10 }} />
        <p
          id="bottom-center-text"
          className="full"
          style={{
            fontFamily: "'Antonio', sans-serif",
            flex: "1 1 0%",
            fontSize: 16,
            fontWeight: "700",
            lineHeight: "1em",
            textAlign: "center",
            color: "black",
            letterSpacing: -0.5,
            whiteSpace: "nowrap",
          }}>
          THE SUMMIT OF THE MANY
        </p>
        <div style={{ width: 10 }} />
        <p id="bottom-right-empty" className="full" style={{ flex: "1 1 0%", fontSize: 12, lineHeight: "1em", textAlign: "right", color: "black" }}></p>
      </div>
    </div>
  )
}

export function Overlay() {
  return (
    <div id="overlay" style={{ position: "absolute", bottom: 40, right: 40, zIndex: 10, pointerEvents: "all" }}>
      <p style={{ flex: "1 1 0%", fontSize: 12, lineHeight: "1em", textAlign: "right", color: "black" }}>
        <a id="link-pmndrs" href="http://pmnd.rs/">pmnd.rs</a> 
        <a id="link-github" href="https://github.com/pmndrs">git</a> 
        <a id="link-codesandbox" href="https://codesandbox.io/s/zxpv7">csb</a>
      </p>
    </div>
  )
}
