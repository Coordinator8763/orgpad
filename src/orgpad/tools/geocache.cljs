(ns ^{:doc "Geocache for map component"}
  orgpad.tools.geocache
  (:require [clojure.data.avl :as avl]
            [orgpad.core.store :as store]
            [orgpad.tools.geohash :as geohash]
            [orgpad.tools.geom :as geom]
            [orgpad.tools.jcolls :as jcolls]))

;; TODO use es6 Map

(defn del-from-place!
  [geocache h id]
  (when (aget geocache h)
    (js-delete (aget geocache h) id)))

(defn add->place!
  [geocache h id & [info]]
  (let [info' (or info true)]
    (if (aget geocache h)
      (aset geocache h id info')
      (aset geocache h (js-obj id info')))))

(defn create!
  [global-cache id view-name]
  (when (= (jcolls/aget-nil global-cache id "geocache" view-name) nil)
    (jcolls/aset! global-cache id "geocache" view-name #js {})))

(defn update-box!
  [global-cache parent-id view-name uid pos size & [old-pos old-size info]]
  (let [geocache (aget global-cache parent-id "geocache" view-name)
        places (if (and pos size)
                 (geohash/box->hashes (pos 0) (pos 1)
                                      (size 0) (size 1))
                 [])
        old-places (if (and old-pos old-size)
                     (geohash/box->hashes (old-pos 0) (old-pos 1)
                                          (old-size 0) (old-size 1))
                     [])]
    ;; (println "update-box!" places old-places)
    (doseq [h old-places]
      (del-from-place! geocache h uid))
    (doseq [h places]
      (add->place! geocache h uid info))))

(defn visible-units
  [global-cache id view-name pos size]
  (let [vis-places (geohash/box->hashes (- (pos 0)) (- (pos 1)) (size 0) (size 1))
        geocache (jcolls/aget-safe global-cache id "geocache" view-name)
        vis-units (persistent!
                   (reduce (fn [units h]
                             (let [hs  (jcolls/aget-safe geocache h)
                                   ids (js/Object.keys hs)]
                               ;; (println "ids" id h ids)
                               (areduce ids idx ret units
                                        (let [info (aget hs (aget ids idx))
                                              ret' (if (= info true)
                                                     ret
                                                     (areduce info idx1 ret1 ret
                                                              (conj! ret1 (aget info idx1))))]
                                          (conj! ret' (js/parseInt (aget ids idx)))))))
                           (transient (avl/sorted-set)) vis-places))]
    ;; (println "vis-places" id pos size vis-places vis-units)
    vis-units))

(defn has-geocache?
  [global-cache parent-id view-name]
  (not= (jcolls/aget-nil global-cache parent-id "geocache" view-name) nil))

(defn clear!
  [global-cache parent-id ids]
  (when-let [geocaches (jcolls/aget-nil global-cache parent-id "geocache")]
    (let [gkeys (js/Object.keys geocaches)]
      (loop [k 0]
        (when (< k (.-length gkeys))
          (let [geocache (aget geocaches (aget gkeys k))
                keys (js/Object.keys geocache)]
            (loop [i 0]
              (when (< i (.-length keys))
                (let [b (aget geocache (aget keys i))]
                  (loop [j 0]
                    (when (< j (.-length ids))
                      (js-delete b (aget ids j))
                      (recur (inc j))))
                  (recur (inc i))))))
          (recur (inc k)))))))

(defn rebuild!
  [global-cache db]
  (let [vertices (store/query db
                              '[:find ?parent ?unit ?view-name ?pos ?w ?h
                                :in $
                                :where
                                [?unit :orgpad/props-refs ?map-prop]
                                [?map-prop :orgpad/refs ?unit]
                                [?map-prop :orgpad/type :orgpad/unit-view-child]
                                [?map-prop :orgpad/view-type :orgpad.map-view/vertex-props]
                                [?map-prop :orgpad/view-name ?view-name]
                                [?map-prop :orgpad/context-unit ?parent]
                                [?map-prop :orgpad/unit-position ?pos]
                                [?map-prop :orgpad/unit-width ?w]
                                [?map-prop :orgpad/unit-height ?h]])
        edges (store/query db
                           '[:find ?parent ?unit ?view-name ?mid-pt ?refs-order
                             :in $
                             :where
                             [?unit :orgpad/props-refs ?map-prop]
                             [?unit :orgpad/refs-order ?refs-order]
                             [?map-prop :orgpad/refs ?unit]
                             [?map-prop :orgpad/type :orgpad/unit-view-child]
                             [?map-prop :orgpad/view-type :orgpad.map-view/link-props]
                             [?map-prop :orgpad/view-name ?view-name]
                             [?map-prop :orgpad/context-unit ?parent]
                             [?map-prop :orgpad/link-mid-pt ?mid-pt]])
        vertices-map (into {} (map (fn [vinfo] [(nth vinfo 1) vinfo])) vertices)
        parent-views (into #{} (map (fn [vinfo] [(nth vinfo 0) (nth vinfo 2)])) vertices)]
    (doseq [[pid view-name] parent-views]
      (create! global-cache pid view-name))
    (doseq [[pid uid view-name pos w h] vertices]
      (update-box! global-cache pid view-name uid pos [w h]))
    (doseq [[pid uid view-name mid-pt refs-order] edges]
      (let [vs (into [] (map (fn [[_ uid]] uid)) refs-order)
            start (vertices-map (vs 0))
            end (vertices-map (vs 1))
            bbox (geom/link-bbox (start 3) (end 3) mid-pt)
            pos (bbox 0)
            size (geom/-- (bbox 1) (bbox 0))]
        (jcolls/aset! global-cache uid "link-info" view-name [pos size])
        (update-box! global-cache pid view-name
                     uid pos size nil nil #js [(vs 0) (vs 1)])))))

(defn copy
  [global-cache pid src dst]
  (when-let [geocaches (jcolls/aget-nil global-cache pid "geocache")]
    (aset geocaches dst (js/goog.cloneObject (aget geocaches src))))
  (let [ks (js/Object.keys global-cache)]
    (areduce ks i ret global-cache
             (let [lid (aget ks i)
                   val (jcolls/aget-nil global-cache lid "link-info" src)]
               (when (-> val nil? not)
                 (jcolls/aset! global-cache lid "link-info" dst val))))))