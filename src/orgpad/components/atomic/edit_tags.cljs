(ns ^{:doc "Tags editor"}
  orgpad.components.atomic.tags-editor
  (:require [rum.core :as rum]
            [clojure.set :as s]
            [orgpad.cycle.life :as lc]
            [cljsjs.react-tagsinput]))


(rum/defcc tags-editor < rum/static lc/parser-type-mixin-context [component id tags]
  [ :div {}
    (.createElement js/React
                    js/ReactTagsInput
                    #js { :value (clj->js (or tags []))
                          :onlyUnique true
                          :onChange (fn [new-tags] 
                                      (let [removed-tags       (s/difference tags new-tags)
                                            added-tags         (s/difference new-tags tags)]
                                        (if (-> removed-tags empty? not)
                                          (lc/transact! component [[ :tags/remove { :db/id id :orgpad/tags removed-tags } ] ] )
                                          (if (-> added-tags empty? not)
                                            (lc/transact! component [[ :tags/add { :db/id id :orgpad/tags added-tags } ] ] ) ) ) ) )
                         }
                    nil) ] )
