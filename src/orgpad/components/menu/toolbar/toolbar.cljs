(ns ^{:doc "Toolbar component"}
  orgpad.components.menu.toolbar
  (:require [rum.core :as rum]
            [sablono.core :as html :refer-macros [html]]
            [orgpad.cycle.life :as lc]
            [orgpad.components.registry :as registry]
            [orgpad.components.menu.circle.component :as mc]
            [orgpad.components.node :as node]
            [orgpad.tools.css :as css]
            [orgpad.tools.js-events :as jev]
            [orgpad.tools.rum :as trum]
            [orgpad.tools.geom :as geom]
            [orgpad.tools.orgpad :as ot]
            [orgpad.tools.orgpad-manipulation :as omt]
            [orgpad.tools.dom :as dom]
            [goog.string :as gstring]
            [goog.string.format]))

;; input format for toolbar
;; two lists, one for left-aligned buttons, one for right-aligned buttons
;;
;; each list contains one element for each group of buttons
;;
;; each group of buttons is represented by a nested list
;;
;; each button is represented by the following map
;;  {:type (:btn|:roll) 
;;   :key             ...   identificator
;;   :title           ...   tooltip hint
;;   :icon            ...   font-awesome style name or nil for no icon
;;   :label           ...   displayed label or nil for no label
;;   :on-mouse-down   ...   function on mouse down
;;   :active          ...   should button be active
;;
;;   for :roll only
;;   :roll-items      ...   list of all roll items
;;  }
;;
;; each roll item is represented by the following map
;;  {:key             ...   identificator
;;   :title           ...   tooltip hint
;;   :icon            ...   font-awesome style name or nil for no icon
;;   :label           ...   displayed label or nil for no label
;;   :on-mouse-down   ...   function on mouse down
;;   :active          ...   should button be active
;;  }

(defn- gen-button
  [alignment title icon label on-mouse-down active]
  (let [button-class (str (if (= alignment :left) "lft-btn" "rt-btn") (when active " active"))]
    (if icon
      [:span
        {:className button-class
         :title title
         :onMouseDown on-mouse-down }
         [:i { :className (str "far " icon " fa-lg fa-fw") }]
         (when label [:span.btn-icon-label label])]
      [:span
        {:className button-class
         :title title
         :onMouseDown on-mouse-down }
         (when label [:span.btn-label label])])))

(defn- toggle-open-state
  [open clicked-roll]
  (if (= open clicked-roll) nil clicked-roll))

(defn- close-roll
  [open f]
  (reset! open nil)
  (f))

(defn- add-test-roll-button
  [open]
  [:span.lft-roll
    [:span.lft-roll-btn
     {:title "Roll test"
      :onMouseDown (jev/make-block-propagation #(swap! open toggle-open-state :test))}
      [:i { :className "far fa-plus-circle fa-lg fa-fw" }]
      [:span.btn-icon-text "Roll button"]
      [:i { :className "fa fa-caret-down" }]]
    (when (= @open :test)
      [:span.roll-items
        [:span.roll-item
         {:title "Roll item 1"
          :onMouseDown #(close-roll open (fn [] (js/console.log "Roll item 1 pressed")))}
          [:i.far.fa-columns.fa-lg.fa-fw]
          [:span.roll-icon-label "Notebook view"]]
        [:span.roll-item
         {:title "Roll item 2"
          :onMouseDown #(js/console.log "Roll item 2 pressed")}
          [:i.far.fa-share-alt.fa-lg.fa-fw]
          [:span.roll-icon-label "Map view"]]
        [:span.roll-item
         {:title "Roll item 3"
          :onMouseDown #(js/console.log "Roll item 3 pressed")}
          [:span.roll-label "Very long test"]]
        [:span.roll-item
         {:title "Roll item 4"
          :onMouseDown #(js/console.log "Roll item 4 pressed")}
          [:span.roll-label "A"]]
        [:span.roll-item
         {:title "Roll item 5"
          :onMouseDown #(js/console.log "Roll item 5 pressed")}
          [:span.roll-label "B"]]
        ])])

(defn- add-notebook-manipulators
  [component {:keys [unit view] :as unit-tree}]
  [:span
    [:span.lft-sep]
     [:span.lft-btn
      {:title "Previous page"
       :onMouseDown #(omt/switch-active-sheet component unit-tree -1) }
      [:i.far.fa-arrow-left.fa-lg.fa-fw]]
     [:span.lft-btn
      {:title "Next page"
       :onMouseDown #(omt/switch-active-sheet component unit-tree 1) }
      [:i.far.fa-arrow-right.fa-lg.fa-fw]]
     [:span.lft-text (apply gstring/format "%d/%d" (ot/get-sheet-number unit-tree))]
     [:span.lft-btn
      {:title "Add page"
       :onMouseDown #(omt/new-sheet component unit-tree) }
      [:i.far.fa-plus-circle.fa-lg.fa-fw]]
     [:span.lft-btn
      {:title "Remove page"
       :onMouseDown #(omt/remove-active-sheet component unit-tree) }
      [:i.far.fa-minus-circle.fa-lg.fa-fw]]
     (let [ ac-unit-tree (ot/active-child-tree unit view)
            ac-view-type (ot/view-type ac-unit-tree)
            class-sheet (str "lft-btn" (when (= ac-view-type :orgpad/atomic-view) " active"))
            class-map (str "lft-btn" (when (= ac-view-type :orgpad/map-view) " active"))]
       (list
         [:span
          {:className class-sheet
           :title "Sheet"
           :onMouseDown #(omt/change-view-type component ac-unit-tree :orgpad/atomic-view) }
           [:i.far.fa-file-alt.fa-lg.fa-fw]]
         [:span
          {:className class-map
           :title "Map"
           :onMouseDown #(omt/change-view-type component ac-unit-tree :orgpad/map-view) }
          [:i.far.fa-share-alt.fa-lg.fa-fw]]))])

(defn- add-view-buttons
  [component unit-tree]
  (let [view-type (ot/view-type unit-tree)
        class-notebook (str "lft-btn" (when (= view-type :orgpad/map-tuple-view) " active"))
        class-map (str "lft-btn" (when (= view-type :orgpad/map-view) " active"))]
    [:span
     [:span
      { :className class-notebook
       :title "Notebook"
       :onMouseDown #(omt/change-view-type component unit-tree :orgpad/map-tuple-view) }
      [:i.far.fa-book.fa-lg.fa-fw]]
     [:span
      { :className class-map
       :title "Map"
       :onMouseDown #(omt/change-view-type component unit-tree :orgpad/map-view) }
      [:i.far.fa-share-alt.fa-lg.fa-fw]]
     (when (= view-type :orgpad/map-tuple-view)
      (add-notebook-manipulators component unit-tree))
     [:span.lft-sep]]))

(defn render-unit-editor-toolbar
  [component unit-tree app-state local-state]
  [:span.toolbar
    [:span.lft-btn
      { :title "Link"
        :onMouseDown (jev/make-block-propagation #(omt/start-link local-state %))
        :onTouchStart (jev/make-block-propagation #(omt/start-link local-state (aget % "touches" 0)))}
     [:i.far.fa-link.fa-lg.fa-fw]]
    [:span.lft-btn
      { :title "Edit"
        :onMouseDown jev/block-propagation
        :onMouseUp (jev/make-block-propagation #(omt/open-unit component unit-tree))}
     [:i.far.fa-edit.fa-lg.fa-fw]]
    [:span.lft-sep]
    (add-view-buttons component unit-tree)

    [:span.rt-btn
      { :title "Remove"
        :onMouseDown #(omt/remove-unit component (ot/uid unit-tree))}
     [:i.far.fa-trash-alt.fa-lg.fa-fw]]])

(defn- render-map-tools
  [local-state-atom]
  (let [canvas-mode (:canvas-mode @local-state-atom)
        class-create (str "lft-btn" (when (= canvas-mode :canvas-create-unit) " active"))
        class-move (str "lft-btn" (when (= canvas-mode :canvas-move) " active"))
        class-select (str "lft-btn" (when (= canvas-mode :canvas-select) " active"))]
    [:span
      [:span
       {:className class-create
        :title "Unit creation mode"
        :onClick #(swap! local-state-atom assoc :canvas-mode :canvas-create-unit)}
        [:i.far.fa-plus-square.fa-lg.fa-fw]]
      [:span
       {:className class-move
        :title "Moving mode"
        :onClick #(swap! local-state-atom assoc :canvas-mode :canvas-move)}
        [:i.far.fa-arrows.fa-lg.fa-fw]]
      [:span
       {:className class-select
        :title "Selection mode"
        :onClick #(swap! local-state-atom assoc :canvas-mode :canvas-select)}
        [:i.far.fa-expand.fa-lg.fa-fw]]
      [:span.lft-sep]]))

(defn- render-copy-tools
  [component unit-tree app-state local-state-atom]
  (let [class-paste (str "lft-btn" (when (= (:local-mode @local-state-atom) :canvas-paste) " active"))]
    [:span
      [:span.lft-btn
       {:title "Copy"
        :onClick #(omt/copy-units-to-clipboard component unit-tree app-state)}
        [:i.far.fa-copy.fa-lg.fa-fw]]
      [:span
       {:className class-paste
        :title "Paste"
        :onMouseDown #(swap! local-state-atom assoc :local-mode :canvas-paste)}
        [:i.far.fa-paste.fa-lg.fa-fw]]
      [:span.lft-sep]]))

(rum/defcs app-toolbar < (rum/local nil ::open)
  [toolbar-state component unit-tree app-state local-state-atom]
  (let [ open (::open toolbar-state) ]
    (add-test-roll-button open)
  ))

(defn render-app-toolbar
  [component unit-tree app-state local-state-atom]
  [:div.map-local-menu
   {:onMouseDown jev/block-propagation
    :onTouchStart jev/block-propagation }
    (render-map-tools local-state-atom)
    (render-copy-tools component unit-tree app-state local-state-atom)
    (add-view-buttons component unit-tree)
    (gen-button :left "Test" "fa-plus" "Another test" #(js/console.log "Test") true )
    (gen-button :left "Test" "fa-chevron-right" nil #(js/console.log "Test") nil)
    (gen-button :left "Test" nil "Just text" #(js/console.log "Test") true )
    (app-toolbar component unit-tree app-state local-state-atom)])
