(ns ^{:doc "Orgpad manipulation tools"}
  orgpad.tools.orgpad-manipulation
  (:require [orgpad.core.store :as store]
            [orgpad.tools.orgpad :as ot]
            [orgpad.tools.dscript :as dscript]
            [orgpad.tools.js-events :as jev]
            [orgpad.tools.geom :as geom]
            [orgpad.cycle.life :as lc]))

(defn change-view-type
  [component unit-tree view-type]
  (lc/transact! component
                [[:orgpad/root-view-conf [unit-tree
                                          {:attr :orgpad/view-type
                                           :value view-type}]]]))

(defn switch-active-sheet
  [component unit-tree dir]
  (lc/transact! component [[:orgpad.sheet/switch-active
                            {:unit-tree unit-tree
                             :direction dir
                             :nof-sheets (ot/refs-count unit-tree)}]]))

(defn new-sheet
  [component unit-tree]
  (lc/transact! component [[:orgpad.units/new-sheet unit-tree]]))

(defn new-sheet-with-type
  [component unit-tree view-type]
  (lc/transact! component
                [[:orgpad.units/new-sheet-with-type [unit-tree view-type]]]))

(defn remove-active-sheet
  [component unit-tree]
  (lc/transact! component [[:orgpad.units/remove-active-sheet-unit unit-tree]]))

(defn remove-unit
  [component params local-state]
  (swap! local-state assoc :selected-unit nil)
  (lc/transact! component [[:orgpad.units/remove-unit
                            params]]))

(defn remove-units
  [component params selection]
  (lc/transact! component [[:orgpad.units/remove-units
                            [params selection]]]))

(defn has-selection?
  [unit-tree app-state]
  (let [selection (get-in app-state [:selections (ot/uid unit-tree)])]
    (and selection
         (-> selection empty? not))))

(defn copy-units-to-clipboard
  [component unit-tree app-state]
  (let [selection (get-in app-state [:selections (ot/uid unit-tree)])]
    (when (and selection
               (-> selection empty? not))
      (lc/transact! component [[:orgpad.units/copy {:pid (ot/uid unit-tree)
                                                    :selection selection}]]))))

(defn is-clipboard-empty?
  [unit-tree app-state]
  (let [data (get-in app-state [:clipboards (ot/uid unit-tree)])]
    (nil? data)))

(defn paste-units-from-clipboard
  [component unit-tree app-state pos]
  (let [data (get-in app-state [:clipboards (ot/uid unit-tree)])]
    ;; (js/console.log "paste-units-from-clipbord" data pos)
    (when data
      (lc/transact! component [[:orgpad.units/paste-to-map {:pid (ot/uid unit-tree)
                                                            :data data
                                                            :view-name (ot/view-name unit-tree)
                                                            :transform (-> unit-tree :view :orgpad/transform)
                                                            :position pos}]]))))

(defn open-unit
  [component {:keys [unit view path-info]}]
  (let [{:keys [orgpad/view-name orgpad/view-type]} view
        view-path (path-info :orgpad/view-path)]
    (lc/transact! component [[:orgpad/root-view-stack {:db/id (unit :db/id)
                                                       :orgpad/view-name view-name
                                                       :orgpad/view-type view-type
                                                       :orgpad/view-path view-path}]])))
