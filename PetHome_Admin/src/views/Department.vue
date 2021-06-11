<template>
  <section>
    <!--工具条-->
    <el-col :span="24" class="toolbar" style="padding-bottom: 0px;">
      <el-form :inline="true" :model="filters">
        <el-form-item>
          <el-input v-model="filters.keyword" placeholder="姓名"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button icon="el-icon-search" size="mini" type="primary" v-on:click="searchData">查询</el-button>
        </el-form-item>
        <el-form-item>
          <el-button icon="el-icon-plus" size="mini" type="primary" @click="showAddDialog">新增</el-button>
        </el-form-item>
      </el-form>
    </el-col>

    <!--列表-->
    <el-table :data="tableData" highlight-current-row v-loading="listLoading" @selection-change="selsChange"
              style="width: 100%;">
      <el-table-column type="selection" width="55">
      </el-table-column>
      <el-table-column prop="id" label="ID" sortable>
      </el-table-column>
      <el-table-column prop="sn" label="编号" sortable>
      </el-table-column>
      <el-table-column prop="name" label="名字" sortable>
      </el-table-column>
      <el-table-column prop="state" label="状态" :formatter="formatState" sortable>
      </el-table-column>
      <el-table-column prop="parent.name" label="上级部门" sortable>
      </el-table-column>
      <el-table-column prop="manager.username" label="部门经理" sortable>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template scope="scope">
          <el-button type="primary" size="mini" icon="el-icon-edit" @click="showEditDialog(scope.$index, scope.row)">
            编辑
          </el-button>
          <el-button type="danger" icon="el-icon-delete" size="mini" @click="deleteSubmit(scope.$index, scope.row)">删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!--工具条-->
    <el-col :span="24" class="toolbar">
      <el-button type="danger" @click="batchRemove" :disabled="this.sels.length===0">批量删除</el-button>
      <el-pagination layout="prev, pager, next" @current-change="handleCurrentChange" :page-size="pageSize" :total="total"
                     style="float:right;">
      </el-pagination>
    </el-col>

    <!--新增、编辑界面-->
    <el-dialog title="新增/编辑" :visible.sync="addDialogVisible" :close-on-click-modal="false">
      <el-form :model="addForm" label-width="80px" :rules="addFormRules" ref="addForm">
        <el-form-item label="编号" prop="sn">
          <el-input v-model="addForm.sn" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="addForm.name" auto-complete="off"></el-input>
        </el-form-item>
       <el-form-item label="上级部门" prop="parentId">
         <el-cascader
             :props="departmentProps"
             v-model="addForm.parentId"
             :options="departments"></el-cascader>
        </el-form-item>
        <el-form-item label="部门经理" prop="managerId">
          <el-select v-model="addForm.managerId" filterable placeholder="请选择">
            <el-option
                v-for="item in employees"
                :key="item.id"
                :label="item.username"
                :value="item.id">
            </el-option>
          </el-select>
        </el-form-item>

      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click.native="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click.native="addSubmit" :loading="addLoading">提交</el-button>
      </div>
    </el-dialog>


  </section>
</template>

<script>
import util from '../common/js/util'
//import NProgress from 'nprogress'
import {getUserListPage, removeUser, batchRemoveUser, editUser, addUser} from '../api/api';

export default {
  data() {
    return {
      /*表单*/
      filters: {
        /*关键词搜索*/
        keyword: ''
      },
      /*表格*/
      tableData: [],
      total: 0,
      page: 1,
      pageSize: 10,
      listLoading: false,
      //列表选中列
      sels: [],

      //弹窗界面是否显示
      addDialogVisible: false,
      addLoading: false,
      addFormRules: {
        name: [
          {required: true, message: '请输入部门名称', trigger: 'blur'},
          {min: 2, max: 16, message: '长度在 2 到 16 个字符', trigger: 'blur'}
        ],
        sn: [
          {required: true, message: '请输入部门编号', trigger: 'blur'},
          {min: 2, max: 16, message: '长度在 2 到 16 个字符', trigger: 'blur'}
        ],
                  managerId:[
                    { required: true, message: '请选择部门经理', trigger: 'blur' }
                  ]
      },
      //新增界面数据
      addForm: {
        id: "",
        name: '',
        sn: '',
        parentId: '',
        managerId: ''
      },
      //一个部门的树结构的数组
      departments:[],
      //修改级联的属性
      departmentProps:{
        value: "id",
        label: "name",
        //选择任意一级
        checkStrictly: true
      },
      //部门经理
      employees:[]
    }
  },
  methods: {
    formatState: function (row, column) {
      return row.state == 0 ? '正常使用' : row.state == 1 ? '注销' : '未知情况';
    },
    //选择页码
    handleCurrentChange(val) {
      this.page = val;
      this.getTableData();
    },
    /**
     * 高级查询
     */
    searchData(){
        this.page=1;
        this.getTableData();
    },
    /**
     * 用户表和高级查询
     */
    //获取用户列表
    getTableData() {
      let para = {
        //当前页
        page: this.page,
        //高级查询
        keyword: this.filters.keyword
      };

      //打开加载动画
      this.listLoading = true;
      /*分页*/
      this.$http.post("/department/page", para).then(res => {
        console.debug("res="+res);

        let {success, message, code, data} = res.data;
        console.debug("resdata="+res.data);

        if (success) {
          //总条数
          this.total = data.total;
          console.debug(data.list)
          //表数据
          this.tableData = data.list;

        } else {
          this.$message.error(message)
        }
        //关闭加载动画
        this.listLoading = false;
      }).catch(error => {
        //关闭加载动画
        this.listLoading = false;
        this.$message.error(error.message);
      });
    },


    //删除方法
    deleteSubmit: function (index, row) {

      this.$confirm('确认删除该记录吗?', '提示', {
        type: 'warning'

      }).then(() => {
        this.listLoading = true;
        this.$http.delete("/department/" + row.id, {}).then(res => {
          let {success, messsage} = res.data;
          if (success) {
            this.$message.success("删除成功");
            this.getTableData();
          } else {
            this.$message.error(messsage);
          }
          this.listLoading = false;
        }).catch(error => {
          this.listLoading = false;
          this.$message.error(error.messsage);
        })
      });
    },

    //显示编辑界面
    showEditDialog: function (index, row) {
      //回显
      //一个row其实代表一个部门对象，里面是关联对象  row.manager, 和 row.parent
      //拉下和级联 v-model=“addForm.managerId” 所以要转一下
      this.addForm = Object.assign({}, row);
      console.debug("row=",row);
      if(row.manager){
        this.addForm.managerId = row.manager.id;
      }
      if(row.parent){
        this.addForm.parentId = row.parent.id;
        console.debug(row.parent.id);
      }

      //和添加使用同一个弹窗
      this.addDialogVisible = true;
    },



    //显示新增界面
    showAddDialog: function () {

      for (let pro in this.addForm) {
        //清空表单
        this.addForm[pro] = "";
      }

      //显示添加弹窗
      this.addDialogVisible = true;
    },

    //新增,编辑提交
    addSubmit: function () {
      //表单校验
      this.$refs.addForm.validate((valid) => {
        if (valid) {
          //表单校验成功
          this.$confirm('确认提交吗？', '提示', {}).then(() => {
            //加载动画
            this.addLoading = true;
            //克隆
            let para = Object.assign({}, this.addForm);

            if(para.parentId && para.parentId.length > 0){
              para.parentId = para.parentId[para.parentId.length -1 ];
            }

            para["parent"] = { id: para.parentId };
            para["manager"] = { id: para.managerId };

            //如果para有ID就是修改，没有就是新增

            let method = "post";/*新增用post请求*/

            /*有id用put*/
            if (para.id) {
              console.debug("paraid"+para.id)

              method = "put";
              console.debug("para"+para)
            }

            console.debug(method)

            //发送不同命令实现
            this.$http[method]("/department", para).then(res => {

              console.debug("resdata="+res.data)
              let {success, message} = res.data;

              if (success) {
                this.$message.success(message);
                //隐藏弹窗
                this.addDialogVisible = false;
                //加载列表
                this.getTableData();
              } else {
                this.$message.error(message)
              }
              this.addLoading = false;
            }).catch(error => {
              this.$message.error(error.message);
              this.addLoading = false;
            });
          });
        }
      });
    },
    selsChange: function (sels) {
      this.sels = sels;
    },

    //批量删除
    batchRemove: function () {
      //获取选中的行的ID数组
      var ids = this.sels.map(item => item.id);

      this.$confirm('你确定删除吗？', '提示', {
        type: 'warning'
      }).then(() => {
        this.listLoading = true;
        let para = { ids: ids };
        this.$http.delete("/department/multiple",{data:para}).then(res=>{
          let {success , message} = res.data;
          if(success){
            this.$message.success("删除成功");
            this.getTableData();
          }else{
            this.$message.error(message);
          }
          this.listLoading = false;
        }).catch(error => {
          this.listLoading = false;
          this.$message.error(error.message);
        });
      });
    },

    //查询上级部门树
    getDepartmentTree(){
      this.$http.get("/department/tree").then(res => {
        console.debug(res);
        let { success  , message , data } = res.data;
        if(success){
          this.departments = data;
          console.debug("上级部门：",data);
        }else{
          this.$message.error("部门加载失败");
        }
      }).catch(error => {
        this.$message.error(error.message);
      })
    },
    //查询部门经理列表
    getEmployees(){
      this.$http.get("/employee/all").then(res => {
        let { success  , message , data } = res.data;
        console.debug()
        if(success){
          this.employees = data;
          console.debug("部门经理：",data);
        }else{
          this.$message.error("部门经理数据加载失败");
        }
      }).catch(error => {
        this.$message.error(error.message);
      })
    }

  },
  mounted() {
    this.getTableData();
    this.getDepartmentTree();
    this.getEmployees();
  }
}

</script>

<style scoped>

</style>