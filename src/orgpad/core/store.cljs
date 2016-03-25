(ns ^{:doc "Store with history"}

  orgpad.core.store

  (:require
   [datascript.core     :as d]
   [com.rpl.specter     :as s]
   [orgpad.tools.datom  :as dtool]))

(defprotocol IStore

  (query [store qry] [store qry params]
    "Query store by 'qry' with given params and returns result.")
  (transact [store qry]
    "Perform transaction on store and returns new one."))

(defprotocol IStoreChanges

  (changed? [store qry] [store qry params]
    "Returns true if 'qry' matches store parts that were changed from
    last call of reset-changes")
  (reset-changes [store]
    "Returns new store with reset cumulative changes"))

(defprotocol IStoreHistory

  (undo [store]
    "Perform undo on store and returns new one.")
  (redo [store]
    "Performs redo on store and returns new one."))

(defprotocol IHistoryRecords

  (push [this record] [this record meta]
    "Returns new hitory record with 'record' and 'meta' added to history")

  (undo-info [this]
    "Returns info for performing undo")

  (redo-info [this]
    "Returns info for performing redo"))

;;; History record

(deftype HistoryRecords [history history-finger]

  IHistoryRecords
  (push
    [this record]
    (push this record nil))

  (push
    [this record meta]
    (if (empty? record)
      this
      (HistoryRecords. (conj (.-history this) record)
                       (or meta (.-history-finger this)))))

  (undo-info [this]
    (let [finger         (.-history-finger this)
          history        (.-history this)
          current-finger (if (nil? finger)
                           (-> history count dec)
                           finger)
          record         (if (neg? current-finger)
                           nil
                           (history current-finger))]
      (if (nil? record )
        [nil nil]
        [record (dec current-finger)])))

  (redo-info [this]
    (let [finger         (.-history-finger this)
          history        (.-history this)
          record         (if (or (nil? finger)
                                 (= (-> history count dec)
                                    finger))
                           nil
                           (history (inc finger)))]
      (if (nil? record)
        [nil nil]
        [record (inc finger)]))))

(defn- new-history-records
  [& [history-records]]
  (HistoryRecords. (or history-records []) nil))

;;; DatomStore

(declare DatomStore)

(defn- tx-report->store
  "Returns new datom store with applied data from 'tx-report'"
  [store tx-report & [finger]]
  (let [tx-data (:tx-data tx-report)]
    ;; (println tx-data)
    (DatomStore. (:db-after tx-report)
                 (push (.-history-records store) tx-data finger)
                 (if (empty? tx-data)
                   (.-cumulative-changes store)
                   (concat (.-cumulative-changes store) tx-data)))))

(deftype DatomStore [db history-records cumulative-changes meta]

  IWithMeta
  (-with-meta [_ new-meta] (DatomStore. db history-records cumulative-changes new-meta))

  IMeta
  (-meta [_] meta)

  IStore
  (query
    [store qry]
    (d/q qry (.-db store)))

  (query
    [store qry params]
    (apply d/q qry (.-db store) params))

  (transact
    [store qry]
    (tx-report->store store (d/with (.-db store) qry)))

  IStoreChanges
  (changed?
    [store qry]
    (-> qry (d/q (.-cumulative-changes store)) empty? not))

  (changed?
    [store qry params]
    (-> (apply d/q qry (.-cumulative-changes store) params) empty? not))

  (reset-changes
    [store]
    (DatomStore. (.-db store)
                 (.-history-records store)
                 []
                 (.-meta store)))

  IStoreHistory
  (undo
    [store]
    (let [[tx finger] (undo-info (.-history-records store))]
       (if (-> tx nil? not)
        (tx-report->store store (d/with (.-db store)
                                        (dtool/datoms->rev-tx tx))
                          finger)
        store)))

  (redo
    [store]
    (let [[tx finger] (redo-info (.-history-records store))]
      (if (-> tx nil? not)
        (tx-report->store store (d/with (.-db store)
                                        (dtool/datoms->tx tx))
                          finger)
        store)))
  )

(defn new-datom-store
  "Creates new datom store with initial 'db' and optional history 'history-records'"
  [db & [history-records]]

  (DatomStore. db (new-history-records history-records) [] nil))

;;; DatomAtomStore - datom remembers history but atom not

(defn- datom-query?
  "Returns true if 'qry' is datascript query"
  [qry]
  (= :find (first qry)) )

(defn- datom-transact-query?
  "Returns true if 'qry' is datascript transaction query"
  [qry]
  (let [f (first qry)
        fnamespace (fnil namespace :none)]
    (or (contains? f :db/id)
        (= (-> f first fnamespace) "db")) ))

(defn- stransact
  "specter transact"
  [store [path action]]
  (if (fn? action)
    (s/transform path action store)
    (s/setval path action store) ))

(deftype DatomAtomStore [datom atom meta]

  IWithMeta
  (-with-meta [_ new-meta] (DatomAtomStore. datom atom new-meta))

  IMeta
  (-meta [_] meta)

  IStore
  (query
    [store qry]
    (if (datom-query? qry)
      (query (.-datom store) qry)
      (s/select qry (.-atom store) )) )

  (query
    [store qry params]
    (if (datom-query? qry)
      (query (.-datom store) qry params)
      (s/select qry (.-atom store)) ))

  (transact
    [store qry]
    (if (datom-transact-query? qry)
      (DatomAtomStore. (transact (.-datom store) qry) (.-atom store) (.-meta store))
      (DatomAtomStore. (.-datom store) (stransact (.-atom store) qry) (.-meta store)) ))

  IStoreChanges
  (changed?
    [store qry]
    (if (datom-query? qry)
      (changed? (.-datom store) qry)
      true))

  (changed?
    [store qry params]
    (if (datom-query? qry)
      (changed? (.-datom store) qry params)
      true))

  (reset-changes
    [store]
    (DatomStore. (reset-changes store)
                 (.-atom store)
                 (.-meta store)))


  IStoreHistory
  (undo
    [store]
    (DatomStore. (undo store)
                 (.-atom store)
                 (.-meta store)))

  (redo
    [store]
    (DatomStore. (undo store)
                 (.-atom store)
                 (.-meta store)))
  )

(defn new-datom-atom-store
  "Creates new datom-atom store with initial value 'init-value',
  database 'db' and optional history 'history-records'"
  [init-value db & [history-records]]

  (DatomAtomStore. (DatomStore. db (new-history-records history-records) [] nil)
                   init-value
                   nil))
