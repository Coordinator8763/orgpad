(ns ^{:doc "CI component"}
  orgpad.components.ci.dialog
  (:require [rum.core :as rum]
            [orgpad.tools.rum :as trum]
            [orgpad.cycle.life :as lc]
            [orgpad.tools.orgpad :as o]
            [orgpad.components.ci.registry :as ci]))

(def ^:private component-scroll-down
  (trum/gen-update-mixin
   (fn [state]
     (let [node (trum/ref-node state "list-node")
           animate (.bind (aget node "animate") node)]
       (aset node "scrollTop" (- (aget node "scrollHeight") (aget node "clientHeight")))
       (animate node #js {:scrollTop (aget node "scrollHeight")})))))

(rum/defc msg-list < rum/static component-scroll-down
  [msgs]

  [:div.ci-msg-list {:ref "list-node"}
   (map-indexed (fn [idx msg]
                  [:div {:key idx}
                   [:div.text
                    (:orgpad/text msg)]
                   [:div.response
                    (:orgpad/response msg)]
                   [:hr]]) msgs)])

(rum/defc msg-input < rum/static
  [context on-change]
  [:div.ci-msg-input
   [:span.ci-mic.fa.fa-microphone.fa-lg]
   (when (not (or (nil? context)
                  (= context :default)))
     [:span.ci-context (str context)])
   [:input.ci-input {:placeholder "Type what to do..."
                     :onKeyPress on-change}]])

(rum/defcc dialog-panel < (rum/local {:ci-visible false}) lc/parser-type-mixin-context
  [component unit-tree app-state msgs]
  (let [local-state (trum/comp->local-state component)]
    [:div {:className (str "ci-dialog-panel " (if (:ci-visible @local-state) "" "hide"))}
     [:span {:className (str "ci-handle fa fa-lg " (if (:ci-visible @local-state) "fa-angle-down" "fa-angle-up"))
             :onClick #(swap! local-state update :ci-visible not)}]
     (msg-list msgs)
     (msg-input (-> msgs last :orgpad/context)
                (fn [ev]
                  (when (= (.-key ev) "Enter")
                    (let [[unit-tree' app-state' msgs'] (trum/comp->args component)
                          text (-> ev .-target .-value)
                          last-msg (last msgs')]
                      (aset ev "target" "value" "")
                      (lc/transact! component [[:orgpad.ci/send-msg
                                                {:text text
                                                 :unit-tree unit-tree'
                                                 :app-state app-state'
                                                 :msg-id (if (:done? last-msg) nil (:db/id last-msg))
                                                 :ctx (o/view-type unit-tree')}]])))))]))
