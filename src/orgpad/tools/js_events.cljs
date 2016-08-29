(ns ^{:doc "JS events tools"}
  orgpad.tools.js-events)

(defn block-propagation
  [ev]
  (doto ev
    .preventDefault
    .stopPropagation))

(defn stop-propagation
  [ev]
  (.stopPropagation ev))
