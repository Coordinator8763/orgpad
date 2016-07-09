(ns ^{:doc "Atomic component"}
  orgpad.components.atomic.component
  (:require [rum.core :as rum]
            [sablono.core :as html :refer-macros [html]]
            [orgpad.cycle.life :as lc]
            [orgpad.components.registry :as registry]
            [orgpad.components.menu.circle :as mc]
            [orgpad.components.atomic.atom-editor :as atom-editor]
            [orgpad.components.atomic.tags-editor :as tags-editor]
            [orgpad.components.atomic.desc-editor :as desc-editor]))

(defn- render-write-mode
  [{:keys [unit view]} app-state]
  [ :div { :className "atomic-view" }
    (rum/with-key ( desc-editor/desc-editor (unit :db/id) view (view :orgpad/desc) ) 0)
    (rum/with-key ( tags-editor/tags-editor (unit :db/id) view (view :orgpad/tags) ) 1)
    (rum/with-key ( atom-editor/atom-editor (unit :db/id) view (view :orgpad/atom) ) 2)
   ] )

(defn- render-read-mode
  [{:keys [view]} app-state]
    [ :div { :className "atomic-view" }
      (when (and (view :orgpad/desc) (not= (view :orgpad/desc) ""))
        [ :div { :key 0 } (view :orgpad/desc)])
      (when (and (view :orgpad/tags) (not= (view :orgpad/tags) []))
        [ :div { :key 1} [ :div {} (html (into [] (map-indexed (fn [idx tag] (html [ :span { :key idx :className "react-tagsinput-tag" } tag ])) (view :orgpad/tags)))) ] ])
      (when (and (view :orgpad/atom) (not= (view :orgpad/atom) ""))
        [ :div  {:dangerouslySetInnerHTML
                 {:__html (view :orgpad/atom)} } ])
     ])

(rum/defc atomic-component < rum/static lc/parser-type-mixin-context
  [unit-tree app-state]
  (if (= (:mode app-state) :write)
    (render-write-mode unit-tree app-state)
    (render-read-mode unit-tree app-state)))

(registry/register-component-info
 :orgpad/atomic-view
 { :orgpad/default-view-info   { :orgpad/view-type :orgpad/atomic-view
                                 :orgpad/view-name "default" }
   :orgpad/class               atomic-component
   :orgpad/needs-children-info false
   :orgpad/view-name           "Atomic View"
  })
