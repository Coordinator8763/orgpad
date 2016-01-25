(ns ^{:doc "Atomic component"}
  orgpad.components.atomic-component
  (:require [om.next :as om :refer-macros [defui]]
            [om.dom :as dom]
            [orgpad.components.queries :as qs]
            [orgpad.components.registry :as registry]))

(defui AtomicComponent
  static om/IQuery
  (query
   [this]
   [{:orgpad/unit-view [{:unit qs/unit-query}
                        {:view qs/unit-view-query}]}])

  Object
  (render
   [this]
   (let [{:keys [orgpad/unit-view]} (om/props this)]
     (dom/div
      #js {:dangerouslySetInnerHTML
           #js {:__html (-> unit-view :unit :orgpad/atom)}
           :className "atomic-view"}
      nil)
     )))

(registry/register-component-info
 :atomic-view
 {:orgpad/default-view-info   {:orgpad/view-type :atomic-view}
  :orgpad/class               AtomicComponent
  :orgpad/factory             (om/factory AtomicComponent)
  :orgpad/needs-children-info false
  :orgpad/view-name           "Atomic View"
  })