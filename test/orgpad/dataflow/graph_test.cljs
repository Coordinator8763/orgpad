(ns orgpad.dataflow.graph-test
  (:require [cljs.test :as test :refer-macros [deftest testing is are]]
            [clojure.test.check :as tc]
            [clojure.test.check.generators :as gen]
            [clojure.test.check.properties :as prop :include-macros true]
            [clojure.test.check.clojure-test :as tct :include-macros true]
            [orgpad.dataflow.graph :as dg]))

;;a->c---
;; \  \  \
;;  -d-e------\
;;b----------->f

(deftest test-topo-order
  (let [df (-> dg/empty-dataflow
               (dg/unit->dataflow-node :a { :node-type :orgpad.dataflow/input-node })
               (dg/unit->dataflow-node :b { :node-type :orgpad.dataflow/input-node })
               (dg/unit->dataflow-node :c { :node-type :orgpad.dataflow/comp-node })
               (dg/unit->dataflow-node :d { :node-type :orgpad.dataflow/comp-node })
               (dg/unit->dataflow-node :e { :node-type :orgpad.dataflow/comp-node })
               (dg/unit->dataflow-node :f { :node-type :orgpad.dataflow/comp-node })
               (dg/unit->dataflow-connection :a :c 1)
               (dg/unit->dataflow-connection :a :d 2)
               (dg/unit->dataflow-connection :b :f 3)
               (dg/unit->dataflow-connection :c :e 1)
               (dg/unit->dataflow-connection :c :f 1)
               (dg/unit->dataflow-connection :d :e 1)
               (dg/unit->dataflow-connection :e :f 1))]
    (testing "sorting"
      (is (= (dg/topo-order df [:f :e :d :c :b :a]) [:b :a :c :d :e :f])))))
